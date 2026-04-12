import { useId } from 'react';

export function MuhawerLogo({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  const gA = `${id}-a`;
  const gB = `${id}-b`;

  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <linearGradient id={gA} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#10B1A7" />
          <stop offset="100%" stopColor="#3DB3C4" />
        </linearGradient>
        <linearGradient id={gB} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#9B8AF9" />
          <stop offset="100%" stopColor="#7C6FF7" />
        </linearGradient>
      </defs>
      {/* Left speech bubble */}
      <path
        d="M3 7a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H9.5l-3.2 3.6c-.4.5-1.3.2-1.3-.5V18a4 4 0 0 1-2-3.5V7z"
        fill={`url(#${gA})`}
      />
      {/* Right speech bubble */}
      <path
        d="M14 8a4 4 0 0 1 4-4h7a4 4 0 0 1 4 4v7a4 4 0 0 1-2 3.5v3.1c0 .7-.9 1-1.3.5L22.5 19H18a4 4 0 0 1-4-4V8z"
        fill={`url(#${gB})`}
        opacity={0.85}
      />
    </svg>
  );
}
