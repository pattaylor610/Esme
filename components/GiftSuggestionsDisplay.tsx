
import React from 'react';
import type { GiftSuggestion, GroundingSource } from '../types';
import { SwipeableGiftCard } from './SwipeableGiftCard';

interface GiftSuggestionsDisplayProps {
  suggestions: GiftSuggestion[];
  sources: GroundingSource[];
  onDismissSuggestion: (id: string) => void;
  onFavouriteSuggestion: (id: string) => void;
  favouritedCount: number; 
}

export const GiftSuggestionsDisplay: React.FC<GiftSuggestionsDisplayProps> = ({
  suggestions,
  sources,
  onDismissSuggestion,
  onFavouriteSuggestion,
}) => {
  const currentSuggestion = suggestions.length > 0 ? suggestions[0] : null;

  return (
    <div className="mt-2 p-0 sm:p-2 bg-forest-light bg-opacity-20 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-text-heading mb-4 sm:mb-6 text-center">
        {currentSuggestion ? "Here's a thoughtful idea:" : "All suggestions viewed!"}
      </h2>
      
      <div className="flex justify-center items-center min-h-[250px] w-full">
        {currentSuggestion ? (
          <div className="w-full max-w-lg">
            <SwipeableGiftCard
              key={currentSuggestion.id} 
              suggestion={currentSuggestion}
              onDismiss={() => onDismissSuggestion(currentSuggestion.id)}
              onFavourite={() => onFavouriteSuggestion(currentSuggestion.id)}
            />
          </div>
        ) : (
          <p className="text-text-body text-center py-8">
            You've viewed all suggestions! Check your Favourites.
          </p>
        )}
      </div>
      
      {sources.length > 0 && (
        <div className="mt-6 pt-4 border-t border-forest-light px-2 sm:px-4">
          <h3 className="text-lg font-semibold text-text-body mb-2">Information Sources (from Google Search):</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {sources.map((source, index) => (
              <li key={index}>
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-forest-mid hover:text-forest-dark hover:underline"
                  title={source.title || source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
           {currentSuggestion === null && suggestions.length === 0 && (
             <p className="text-text-muted text-xs mt-3">These sources were found, but no specific gift items could be generated this time. You might want to adjust your input or check your favourites.</p>
           )}
        </div>
      )}

      {currentSuggestion && (
        <div className="text-center text-sm text-text-muted mt-6 pb-4 px-2">
          <p><strong>Tip:</strong> Swipe Right to Favourite, Swipe Left to Dismiss.</p>
        </div>
      )}
    </div>
  );
};