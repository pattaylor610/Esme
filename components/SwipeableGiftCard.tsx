import React, { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { GiftSuggestion } from '../types';

interface SwipeableGiftCardProps {
  suggestion: GiftSuggestion;
  onDismiss: () => void;
  onFavourite: () => void;
}

export const SwipeableGiftCard: React.FC<SwipeableGiftCardProps> = ({ suggestion, onDismiss, onFavourite }) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null);

  const handleDismissAction = () => {
    if (isExiting) return;
    setIsExiting('left');
    setTimeout(() => {
      onDismiss();
      setIsExiting(null);
      setSwipeOffset(0);
    }, 300);
  };

  const handleFavouriteAction = () => {
    if (isExiting) return;
    setIsExiting('right');
    setTimeout(() => {
      onFavourite();
      setIsExiting(null);
      setSwipeOffset(0);
    }, 300);
  };

  const handlers = useSwipeable({
    onSwipedLeft: handleDismissAction,
    onSwipedRight: handleFavouriteAction,
    onSwiping: (eventData) => {
      if (isExiting) return;
      setIsSwiping(true);
      const limitedDeltaX = Math.max(-window.innerWidth / 3, Math.min(window.innerWidth / 3, eventData.deltaX));
      setSwipeOffset(limitedDeltaX);
    },
    onSwiped: () => {
      setIsSwiping(false);
      if (!isExiting) {
        setSwipeOffset(0);
      }
    },
    delta: 50,
    preventScrollOnSwipe: true,
    trackMouse: true,
    trackTouch: true,
  });

  const getCardStyle = () => {
    if (isExiting === 'left') {
      return { transform: 'translateX(-150%)', opacity: 0, transition: 'transform 0.3s ease-out, opacity 0.3s ease-out' };
    }
    if (isExiting === 'right') {
      return { transform: 'translateX(150%)', opacity: 0, transition: 'transform 0.3s ease-out, opacity 0.3s ease-out' };
    }
    if (isSwiping) {
      return { transform: `translateX(${swipeOffset}px)`, transition: 'none' };
    }
    return { transition: 'transform 0.2s ease-out' };
  };

  const getOverlayOpacity = () => {
    if (!isSwiping || isExiting) return 0;
    const maxOpacity = 0.8;
    return Math.min(maxOpacity, Math.abs(swipeOffset) / (window.innerWidth / 4.5));
  };

  return (
    <div
      {...handlers}
      style={getCardStyle()}
      className="bg-main-bg rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-grab active:cursor-grabbing relative overflow-hidden flex flex-col min-h-[200px] sm:min-h-[250px]"
      role="group"
      aria-label={`Gift suggestion: ${suggestion.name}. Swipe right to like, swipe left to dislike.`}
    >
      {isSwiping && !isExiting && (
        <>
          {swipeOffset > 20 && (
            <div
              className="absolute inset-0 bg-green-500 flex items-center justify-center p-4 pointer-events-none z-10"
              style={{ opacity: getOverlayOpacity() }}
            >
              <span className="text-white font-bold text-xl sm:text-2xl">Like ♡ →</span>
            </div>
          )}
          {swipeOffset < -20 && (
             <div
              className="absolute inset-0 bg-red-500 flex items-center justify-center p-4 pointer-events-none z-10"
              style={{ opacity: getOverlayOpacity() }}
            >
              <span className="text-white font-bold text-xl sm:text-2xl">← Dislike ✕</span>
            </div>
          )}
        </>
      )}
      
      <div className="p-4 sm:p-6 flex-grow flex flex-col justify-center">
        <h3 className="text-xl sm:text-2xl font-medium text-forest-dark mb-1 sm:mb-2">{suggestion.name}</h3>
        <p className="text-text-body mt-1 text-sm sm:text-base">{suggestion.reason}</p>
        {suggestion.price && (
          <p className="text-xs sm:text-sm text-text-muted mt-2 sm:mt-3">
            <strong>Price:</strong> {suggestion.price}
          </p>
        )}
      </div>
    </div>
  );
};