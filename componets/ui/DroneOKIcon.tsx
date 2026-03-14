"use client";

interface Props {
  size?: number;
  color?: string;
  spinDuration?: number;
}

// Check path length: M16 24 → L21 30 → L33 17
// seg1 = √((21-16)²+(30-24)²) = √61  ≈ 7.81
// seg2 = √((33-21)²+(17-30)²) = √313 ≈ 17.69  →  total ≈ 26
const CHECK_LEN = 26;

export default function DroneOKIcon({
  size = 32,
  color = "#059669",
  spinDuration = 2.5,
}: Props) {
  const id = `droneok-${size}-${color.replace("#", "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <style>{`
        @keyframes ${id}-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ${id}-draw {
          from { stroke-dashoffset: ${CHECK_LEN}; }
          to   { stroke-dashoffset: 0; }
        }
        .${id}-rotors {
          transform-box: view-box;
          transform-origin: 24px 24px;
          animation: ${id}-spin ${spinDuration}s linear infinite;
        }
        .${id}-check {
          stroke-dasharray: ${CHECK_LEN};
          stroke-dashoffset: ${CHECK_LEN};
          animation: ${id}-draw 0.6s ease forwards;
          animation-delay: 0.5s;
        }
      `}</style>

      {/* Static circle */}
      <circle cx="24" cy="24" r="17" fill="none" stroke={color} strokeWidth="3" />

      {/* Spinning rotors */}
      <g className={`${id}-rotors`}>
        <line x1="10.5" y1="10.5" x2="4"  y2="4"  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="37.5" y1="10.5" x2="44" y2="4"  stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="10.5" y1="37.5" x2="4"  y2="44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="37.5" y1="37.5" x2="44" y2="44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Check — draws once on mount */}
      <path
        className={`${id}-check`}
        d="M16 24 L21 30 L33 17"
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
