
import React from 'react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="text-center text-text-muted text-sm py-8 mt-auto w-full">
      <p>&copy; {currentYear} Esme Gift Finder. Powered by You &amp; Gemini.</p>
    </footer>
  );
};