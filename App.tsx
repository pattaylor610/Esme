
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { GiftForm } from './components/GiftForm';
import { GiftSuggestionsDisplay } from './components/GiftSuggestionsDisplay';
import { Footer } from './components/Footer';
import { LoadingInstructions } from './components/LoadingInstructions'; 
import { FavouritesView } from './components/FavouritesView';
import { generateGiftSuggestions } from './services/geminiService.ts'; // Added .ts extension
import type { FormData, GiftSuggestion, GroundingSource, GeminiServiceResponse } from './types';
import { Gender } from './types';
import { INITIAL_CHARACTERISTICS_COUNT, MIN_BUDGET_ABSOLUTE, MAX_BUDGET_ABSOLUTE } from './constants';

type CurrentView = 'form' | 'loading' | 'suggestions' | 'favourites';

const App: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    recipientCharacteristics: Array(INITIAL_CHARACTERISTICS_COUNT).fill(''),
    gender: Gender.PREFER_NOT_TO_SAY,
    yearOfBirth: '',
    location: '',
    minBudget: MIN_BUDGET_ABSOLUTE,
    maxBudget: MAX_BUDGET_ABSOLUTE,
    occasion: '',
  });
  const [displayedSuggestions, setDisplayedSuggestions] = useState<GiftSuggestion[]>([]);
  const [favouritedSuggestions, setFavouritedSuggestions] = useState<GiftSuggestion[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [initialFetchDone, setInitialFetchDone] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<CurrentView>('form');
  const [justFinishedSwipingAll, setJustFinishedSwipingAll] = useState<boolean>(false);

  useEffect(() => {
    // This effect handles auto-navigation to favourites after swiping all suggestions.
    if (currentView === 'suggestions' && initialFetchDone && !isLoading && displayedSuggestions.length === 0 && justFinishedSwipingAll) {
      setCurrentView('favourites');
      setJustFinishedSwipingAll(false); // Reset flag
    }
  }, [displayedSuggestions, currentView, initialFetchDone, isLoading, justFinishedSwipingAll]);


  const handleFormSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setDisplayedSuggestions([]);
    setSources([]);
    setInitialFetchDone(false);
    setCurrentView('loading'); // Transition to loading view
    setJustFinishedSwipingAll(false);

    try {
      if (!import.meta.env.VITE_API_KEY) {
        setError("API key is not configured. Please set the VITE_API_KEY environment variable in your .env file.");
        setIsLoading(false);
        setInitialFetchDone(true);
        // currentView remains 'loading' to show the error
        return;
      }
      const result: GeminiServiceResponse = await generateGiftSuggestions(formData);
      
      setInitialFetchDone(true);
      setIsLoading(false); // Loading finished before setting suggestions

      if (result.suggestions.length > 0 || result.sources.length > 0) {
        setDisplayedSuggestions(result.suggestions);
        setSources(result.sources);
        setCurrentView('suggestions');
      } else {
        setError("No gift ideas found this time. Try adjusting your search criteria or broadening your budget!");
        // currentView remains 'loading' to display this specific error.
        // User can then use 'Cancel' on LoadingInstructions to go back to form.
      }
    } catch (err) {
      console.error("Error fetching gift suggestions:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred. Please try again.");
      setInitialFetchDone(true);
      setIsLoading(false);
      // currentView remains 'loading' to display the error
    }
  }, [formData]);

  const commonSuggestionActionLogic = () => {
    // If there's only one suggestion left, and it's acted upon, set the flag.
    if (displayedSuggestions.length === 1) {
      setJustFinishedSwipingAll(true);
    }
  };

  const handleDismissSuggestion = useCallback((id: string) => {
    commonSuggestionActionLogic();
    setDisplayedSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  }, [displayedSuggestions]); // ensure displayedSuggestions is a dependency

  const handleFavouriteSuggestion = useCallback((id: string) => {
    const suggestionToFavourite = displayedSuggestions.find(suggestion => suggestion.id === id);
    if (suggestionToFavourite) {
      commonSuggestionActionLogic();
      setFavouritedSuggestions(prev => {
        if (prev.find(fav => fav.id === id)) return prev;
        return [...prev, suggestionToFavourite];
      });
      setDisplayedSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
    }
  }, [displayedSuggestions]); // ensure displayedSuggestions is a dependency

  const handleUnfavouriteSuggestion = useCallback((id: string) => {
    setFavouritedSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  }, []);

  const navigateToFavourites = () => setCurrentView('favourites');
  const navigateToForm = () => {
    setCurrentView('form');
    // Reset states that are relevant to a fresh form attempt
    setError(null);
    setIsLoading(false);
    // initialFetchDone will be reset on next submit
  };


  return (
    <div className="min-h-screen bg-neutral-bg flex flex-col items-center p-4 sm:p-8 font-sans">
      <Header />
      <main className="max-w-2xl w-full bg-main-bg shadow-xl rounded-lg p-6 sm:p-8 mt-8 mb-8">
        
        {currentView !== 'favourites' && (
          <div className="mb-6 text-right">
            <button
              onClick={navigateToFavourites}
              className="bg-accent-amber hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-amber"
              aria-live="polite"
              aria-disabled={isLoading && currentView === 'loading'}
              disabled={isLoading && currentView === 'loading'}
            >
              <span aria-hidden="true" className="mr-1.5">☆</span> Favourites ({favouritedSuggestions.length})
            </button>
          </div>
        )}

        {currentView === 'form' && (
          <>
            <GiftForm
              formData={formData}
              onFormDataChange={setFormData}
              onSubmit={handleFormSubmit}
              isLoading={isLoading}
            />
            {!isLoading && !error && !initialFetchDone && (
               <div className="mt-6 p-4 text-center text-text-muted">
                 <p>Fill out the form above and let Esme find the perfect gift!</p>
               </div>
            )}
          </>
        )}

        {currentView === 'loading' && (
          <LoadingInstructions
            isLoading={isLoading}
            error={error}
            onCancel={navigateToForm}
          />
        )}
        
        {currentView === 'suggestions' && initialFetchDone && !error && (
          <GiftSuggestionsDisplay
            suggestions={displayedSuggestions}
            sources={sources}
            onDismissSuggestion={handleDismissSuggestion}
            onFavouriteSuggestion={handleFavouriteSuggestion}
            favouritedCount={favouritedSuggestions.length}
          />
        )}
        {currentView === 'suggestions' && error && (
             <div className="mt-6 p-4 bg-error-red-light border border-error-red text-error-red rounded-md" role="alert">
                <strong className="font-bold">Oops! </strong>
                <span className="block sm:inline">{error} An error occurred. </span>
                <button onClick={navigateToForm} className="underline font-semibold hover:text-red-700">Try again from form</button>
              </div>
        )}


        {currentView === 'favourites' && (
          <FavouritesView
            favourites={favouritedSuggestions}
            onUnfavourite={handleUnfavouriteSuggestion}
            onBackToFinder={navigateToForm}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default App;
