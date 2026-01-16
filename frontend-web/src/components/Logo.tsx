'use client';

import { useState } from 'react';

export default function Logo({ size = 56 }: { size?: number }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    // Fallback SVG logo if image fails to load
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        <rect
          x="20"
          y="40"
          width="60"
          height="35"
          rx="5"
          fill="#6366f1"
          stroke="#4f46e5"
          strokeWidth="2"
        />
        <rect x="25" y="50" width="12" height="12" rx="2" fill="#cbd5e1" opacity="0.6" />
        <rect x="42" y="50" width="12" height="12" rx="2" fill="#cbd5e1" opacity="0.6" />
        <rect x="59" y="50" width="12" height="12" rx="2" fill="#cbd5e1" opacity="0.6" />
        <circle cx="35" cy="82" r="8" fill="#0a0a0a" stroke="#6366f1" strokeWidth="2" />
        <circle cx="65" cy="82" r="8" fill="#0a0a0a" stroke="#6366f1" strokeWidth="2" />
        <path
          d="M 75 25 L 75 15 L 90 20 L 75 25 Z"
          fill="#ef4444"
          stroke="#dc2626"
          strokeWidth="2"
        />
        <circle cx="80" cy="20" r="3" fill="#f1f5f9" />
        <ellipse cx="78.5" cy="20" rx="0.8" ry="1" fill="#0a0a0a" />
        <ellipse cx="81.5" cy="20" rx="0.8" ry="1" fill="#0a0a0a" />
        <path d="M 78 21.5 Q 80 22.5 82 21.5" stroke="#0a0a0a" strokeWidth="0.8" fill="none" />
      </svg>
    );
  }

  return (
    <img
      src="/logo.png"
      alt="LugaBus Logo"
      width={size}
      height={size}
      style={{ 
        flexShrink: 0,
        objectFit: 'contain',
        display: 'block'
      }}
      onError={() => setImageError(true)}
    />
  );
}
