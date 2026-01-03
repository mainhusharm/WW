import React from 'react';

const Lightning = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <div className="absolute w-full h-full bg-transparent animate-lightning-border" />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default Lightning;
