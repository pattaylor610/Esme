import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
// Explicitly type FormData used within this service
interface ServiceFormData {
  recipientCharacteristics: string[];
  gender: string; // Assuming Gender enum resolves to string
  yearOfBirth: string;
  location: string;
  minBudget: number;
  maxBudget: number;
  occasion?: string;
}
import type { GiftSuggestion, GroundingSource, GeminiServiceResponse } from '../types';
import { GEMINI_MODEL_NAME, MAX_BUDGET_ABSOLUTE } from '../constants';


const parseGeminiResponse = (responseText: string): GiftSuggestion[] => {
  const suggestions: GiftSuggestion[] = [];
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }

  try {
    const parsedData = JSON.parse(jsonStr);
    let potentialSuggestions: any[] = [];
    if (Array.isArray(parsedData)) {
      potentialSuggestions = parsedData;
    } else if (parsedData && Array.isArray(parsedData.suggestions)) {
      potentialSuggestions = parsedData.suggestions;
    } else if (parsedData && typeof parsedData.name === 'string' && typeof parsedData.reason === 'string') {
      potentialSuggestions = [parsedData];
    }

    potentialSuggestions.forEach(item => {
      if (item && typeof item.name === 'string' && typeof item.reason === 'string') {
        suggestions.push({
          id: crypto.randomUUID(),
          name: item.name,
          reason: item.reason,
          price: typeof item.price === 'string' ? item.price : undefined,
        });
      }
    });
    if (suggestions.length > 0) return suggestions;

  } catch (e) {
    console.warn("Failed to parse Gemini response as JSON, falling back to ###Suggestion parsing:", e);
  }

  // Fallback parsing
  const suggestionBlocks = responseText.split("###Suggestion").slice(1);
  for (const block of suggestionBlocks) {
    const lines = block.trim().split('\n');
    let giftName = "";
    let giftReason = "";
    let giftPrice: string | undefined = undefined;

    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      if (lowerLine.startsWith("gift:")) {
        giftName = line.substring("gift:".length).trim();
      } else if (lowerLine.startsWith("reason:")) {
        giftReason = line.substring("reason:".length).trim();
      } else if (lowerLine.startsWith("price:")) {
        giftPrice = line.substring("price:".length).trim();
      }
    }

    if (giftName) {
      suggestions.push({
        id: crypto.randomUUID(),
        name: giftName,
        reason: giftReason || "No specific reason provided.",
        price: giftPrice
      });
    }
  }
  return suggestions;
};

export const generateGiftSuggestions = async (formData: ServiceFormData): Promise<GeminiServiceResponse> => {
  const apiKey = import.meta.env.VITE_API_KEY;

  if (!apiKey) {
    throw new Error("VITE_API_KEY environment variable not set. Please ensure it's in your .env file.");
  }
  const ai = new GoogleGenAI({ apiKey });

  const currentYear = new Date().getFullYear();
  let ageDetails = "Not specified";
  if (formData.yearOfBirth) {
    const year = parseInt(formData.yearOfBirth, 10);
    if (!isNaN(year) && year >= 1900 && year <= currentYear) {
      ageDetails = `${currentYear - year} years old (born ${year})`;
    } else {
      ageDetails = `(Year of birth: ${formData.yearOfBirth}, appears invalid)`;
    }
  }
  
  let budgetDetails = `from £${formData.minBudget} to £${formData.maxBudget}`;
  if (formData.maxBudget >= MAX_BUDGET_ABSOLUTE) {
    budgetDetails = `from £${formData.minBudget} to £${MAX_BUDGET_ABSOLUTE}+`;
  }
  if (formData.minBudget === formData.maxBudget && formData.maxBudget < MAX_BUDGET_ABSOLUTE) {
    budgetDetails = `around £${formData.minBudget}`;
  } else if (formData.minBudget === formData.maxBudget && formData.maxBudget >= MAX_BUDGET_ABSOLUTE) {
     budgetDetails = `£${MAX_BUDGET_ABSOLUTE}+`;
  }


  const occasionDetails = formData.occasion ? formData.occasion : "Not specified";
  
  const characteristicsString = formData.recipientCharacteristics
    .map(char => char.trim())
    .filter(char => char.length > 0)
    .map(char => `- ${char}`)
    .join('\n') || "- Not specified";

  const prompt = `
You are Esme, a friendly and insightful gift recommendation expert.
Your task is to suggest 5 personalized gifts based on the information provided.
Use Google Search to find relevant, trendy, and location-specific ideas.
The budget is specified in GBP. If the upper budget is £${MAX_BUDGET_ABSOLUTE}+, it means £${MAX_BUDGET_ABSOLUTE} or more.

Information about the recipient:
- Key characteristics/interests:
${characteristicsString}
- Gender: ${formData.gender}
- Age/Year of Birth: ${ageDetails}
- Location: ${formData.location}
- Budget (GBP): ${budgetDetails}
- Occasion: ${occasionDetails}

Respond with a JSON array where each object represents a gift and has the following structure:
{
  "name": "Name of the gift",
  "reason": "Why this gift is suitable, linking back to the provided characteristics, location, occasion and current trends. Be concise and thoughtful.",
  "price": "Estimated price range in GBP, e.g., ~£25, £50-£75, Free, Varies, Low Cost. This should respect the provided budget."
}

Example of a JSON object in the array (assuming a characteristic like 'loves hiking' was provided and budget £50-£100):
{
  "name": "A high-quality, lightweight daypack for hiking",
  "reason": "Perfect for someone who loves hiking, as mentioned. This supports their hobby and encourages outdoor adventures near ${formData.location}. Great for their ${occasionDetails !== 'Not specified' ? occasionDetails : 'next adventure'}.",
  "price": "~£60-£100"
}

Ensure your reasoning is concise and directly relates to the recipient's profile.
Focus on thoughtful and unique ideas. If budget is low, suggest thoughtful, low-cost, or experience-based gifts.
If specific interests or hobbies are mentioned in the characteristics, try to relate a suggestion to them. If an occasion is mentioned, tailor the gift to it.
Provide a price estimate for each gift in GBP, respecting the user's budget range.
Output up to 5 gift suggestions in the JSON array.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });

    const allParsedSuggestions = parseGeminiResponse(response.text);
    
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources: GroundingSource[] = [];
    if (groundingMetadata) {
      for (const chunk of groundingMetadata) {
        if (chunk.web) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
        }
      }
    }
    
    // Return up to 5 suggestions
    return { suggestions: allParsedSuggestions.slice(0, 5), sources };

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        if (error.message.includes("API_KEY_INVALID") || error.message.includes("API key not valid")) {
             throw new Error("The API key is invalid. Please check your configuration.");
        }
         throw new Error(`Failed to get gift suggestions: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching gift suggestions.");
  }
};
