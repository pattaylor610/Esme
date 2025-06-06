
import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingInstructionsProps {
  isLoading: boolean;
  error: string | null;
  onCancel: () => void;
}

export const LoadingInstructions: React.FC<LoadingInstructionsProps> = ({ isLoading, error, onCancel }) => {
  return (
    <div className="text-center py-10 px-4 flex flex-col items-center justify-center min-h-[300px]">
      {isLoading && !error && <LoadingSpinner />}
      
      {isLoading && !error && (
        <>
          <h2 className="text-2xl font-semibold text-text-heading mt-4 mb-2">Esme is thinking...</h2>
          <p className="text-text-body mb-1">Get ready to discover some thoughtful gift ideas!</p>
          <p className="text-text-muted text-sm mb-6">
            <strong>Swipe Right</strong> to Favourite, <strong>Swipe Left</strong> to Dismiss.
          </p>
        </>
      )}

      {error && (
        <div className="w-full max-w-md p-4 bg-error-red-light border border-error-red text-error-red rounded-md mb-6" role="alert">
          <strong className="font-bold">Oops! Something went wrong.</strong>
          <p className="block sm:inline mt-1">{error}</p>
        </div>
      )}

      <button
        onClick={onCancel}
        className="mt-4 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2 px-6 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
        aria-label="Cancel and return to form"
      >
        {error ? 'Back to Form' : 'Cancel'}
      </button>
    </div>
  );
};