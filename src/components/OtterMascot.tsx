import React from 'react';

export function OtterMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Tail */}
      <path d="M120 160 Q180 170 170 130 Q160 150 120 170 Z" fill="#6B4423" />
      
      {/* Body */}
      <path d="M60 100 C60 40, 140 40, 140 100 C140 170, 130 190, 100 190 C70 190, 60 170, 60 100 Z" fill="#8B5A2B" />
      
      {/* Belly */}
      <path d="M75 105 C75 65, 125 65, 125 105 C125 155, 115 185, 100 185 C85 185, 75 155, 75 105 Z" fill="#D2B48C" />
      
      {/* Ears */}
      <circle cx="55" cy="70" r="14" fill="#8B5A2B" />
      <circle cx="145" cy="70" r="14" fill="#8B5A2B" />
      <circle cx="55" cy="70" r="7" fill="#6B4423" />
      <circle cx="145" cy="70" r="7" fill="#6B4423" />
      
      {/* Eyes */}
      <circle cx="82" cy="80" r="7" fill="#1A1A1A" />
      <circle cx="118" cy="80" r="7" fill="#1A1A1A" />
      <circle cx="85" cy="77" r="2.5" fill="#FFFFFF" />
      <circle cx="121" cy="77" r="2.5" fill="#FFFFFF" />
      
      {/* Snout area */}
      <ellipse cx="100" cy="98" rx="22" ry="16" fill="#E6D5B8" />
      
      {/* Nose */}
      <ellipse cx="100" cy="92" rx="9" ry="6" fill="#1A1A1A" />
      <ellipse cx="102" cy="90" rx="3" ry="1.5" fill="#555555" />
      
      {/* Mouth */}
      <path d="M90 102 Q100 110 110 102" fill="none" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Whiskers */}
      <line x1="75" y1="95" x2="55" y2="92" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="75" y1="100" x2="50" y2="102" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="125" y1="95" x2="145" y2="92" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <line x1="125" y1="100" x2="150" y2="102" stroke="#1A1A1A" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      
      {/* Concierge Hat (Bellhop) */}
      <path d="M78 42 L122 42 L115 15 L85 15 Z" fill="#8B0000" />
      <rect x="75" y="40" width="50" height="6" fill="#FFD700" rx="3" />
      <circle cx="100" cy="15" r="5" fill="#FFD700" />
      <path d="M85 15 L115 15 L110 25 L90 25 Z" fill="#A52A2A" opacity="0.5" />
      
      {/* Bowtie */}
      <polygon points="100,125 80,112 80,138" fill="#8B0000" />
      <polygon points="100,125 120,112 120,138" fill="#8B0000" />
      <circle cx="100" cy="125" r="6" fill="#FFD700" />
      <circle cx="100" cy="125" r="4" fill="#DAA520" />
      
      {/* Paws (holding something or just resting) */}
      <circle cx="75" cy="145" r="12" fill="#8B5A2B" />
      <circle cx="125" cy="145" r="12" fill="#8B5A2B" />
      <path d="M70 148 L80 148" stroke="#6B4423" strokeWidth="2" strokeLinecap="round" />
      <path d="M120 148 L130 148" stroke="#6B4423" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
