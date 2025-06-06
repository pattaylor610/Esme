export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  OTHER = "Other",
  PREFER_NOT_TO_SAY = "Prefer not to say",
}

export interface FormData {
  recipientCharacteristics: string[];
  gender: Gender;
  yearOfBirth: string; 
  location: string;
  minBudget: number; // Lower bound of the budget range
  maxBudget: number; // Upper bound of the budget range
  occasion?: string; 
}

export interface GiftSuggestion {
  id: string; 
  name: string;
  reason: string;
  price?: string; 
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GeminiServiceResponse {
  suggestions: GiftSuggestion[];
  sources: GroundingSource[];
}