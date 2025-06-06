
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-6 text-center w-full">
      <h1 className="text-4xl sm:text-5xl font-bold text-text-heading">Esme</h1>
      <p className="text-lg text-text-body mt-2">It's the thought that counts.</p>
    </header>
  );
};