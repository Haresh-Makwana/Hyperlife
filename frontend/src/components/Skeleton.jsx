import React from 'react';
import '../styles/App.css'; // Make sure this points to where you put the CSS

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