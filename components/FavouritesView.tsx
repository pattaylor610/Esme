import React from 'react';
import type { GiftSuggestion } from '../types';

interface FavouriteItemProps {
  suggestion: GiftSuggestion;
  onUnfavourite: (id: string) => void;
}

const FavouriteItem: React.FC<FavouriteItemProps> = ({ suggestion, onUnfavourite }) => {

  const handleGoogleSearch = () => {
    const query = encodeURIComponent(suggestion.name);
    const googleSearchUrl = `https://www.google.com/search?q=${query}`;
    window.open(googleSearchUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <li className="bg-earth-tan bg-opacity-50 p-4 rounded-lg shadow-md flex flex-col">
      <div className="flex-grow">
        <h3 className="text-xl font-medium text-forest-dark">{suggestion.name}</h3>
        <p className="text-text-body mt-1 text-sm">{suggestion.reason}</p>
        {suggestion.price && (
          <p className="text-sm text-text-muted mt-2">
            <strong>Price:</strong> {suggestion.price}
          </p>
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-forest-light w-full flex justify-end items-center space-x-3">
        <button
          onClick={() => onUnfavourite(suggestion.id)}
          className="bg-error-red hover:bg-red-700 text-white font-semibold py-2 px-3 rounded-md text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error-red"
          aria-label={`Remove ${suggestion.name} from favourites`}
        >
          Remove
        </button>
        <button
          onClick={handleGoogleSearch}
          className="bg-forest-mid hover:bg-forest-dark text-white font-semibold py-2 px-4 rounded-md text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-mid"
          aria-label={`Find ${suggestion.name} on Google`}
        >
          Find gift
        </button>
      </div>
    </li>
  );
};


interface FavouritesViewProps {
  favourites: GiftSuggestion[];
  onUnfavourite: (id: string) => void;
  onBackToFinder: () => void;
}

export const FavouritesView: React.FC<FavouritesViewProps> = ({ favourites, onUnfavourite, onBackToFinder }) => {
  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-semibold text-text-heading">Your Favourites <span aria-hidden="true">☆</span></h2>
        <button
          onClick={onBackToFinder}
          className="bg-forest-mid hover:bg-forest-dark text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-mid"
          aria-label="Back to Gift Finder Form"
        >
          &larr; Back to Gift Finder
        </button>
      </div>

      {favourites.length === 0 ? (
        <p className="text-text-body text-center py-8">
          You haven't favourited any gifts yet. Swipe right on gift ideas to save them here!
        </p>
      ) : (
        <ul className="space-y-4">
          {favourites.map((suggestion) => (
            <FavouriteItem
              key={suggestion.id}
              suggestion={suggestion}
              onUnfavourite={onUnfavourite}
            />
          ))}
        </ul>
      )}
    </div>
  );
};