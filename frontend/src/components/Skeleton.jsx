import React from 'react';

// 🚀 THE FIX: Removed the broken CSS import. 
// Your global App.css already handles these classes natively.

export default function Skeleton({ 
  variant = 'text', 
  width = '100%', 
  height = '20px', 
  className = '' 
}) {
  const baseClass = 'skeleton-wrapper';
  const variantClass = `skeleton-${variant}`;
  
  return (
    <div 
      className={`${baseClass} ${variantClass} ${className}`}
      style={{ width, height }}
    ></div>
  );
}