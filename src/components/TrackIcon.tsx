
interface TrackIconProps {
  id: string;
  className?: string;
  color?: string;
}

export function TrackIcon({ id, className = "w-6 h-6", color = "currentColor" }: TrackIconProps) {
  const strokeColor = color;

  switch (id) {
    case "silicon-explained": // Microscope / Tech foundations
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 18h8M3 22h18M14 22a7 7 0 1 0-7-7M9 14h2M9 12a3 3 0 0 1 6 0v3" />
          <circle cx="12" cy="6" r="2" />
        </svg>
      );
    case "die-chronicles": // Layout Grid / Silicon Die shot
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9M15 21V9" />
        </svg>
      );
    case "chip-lore": // Book / History
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
          <path d="M6 6h10M6 10h10" />
        </svg>
      );
    case "code-to-core": // Code Terminal / Software-hardware map
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case "paper-lab": // Chemistry Flask / Academic Research
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 3h6M10 9h4M10 3v6l-4 8a2 2 0 0 0 1.8 2.8h8.4a2 2 0 0 0 1.8-2.8l-4-8V3" />
        </svg>
      );
    case "the-tradeoff": // Balance Scales
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3v17M12 20H4M12 20h8M19 7l-7-4-7 4" />
          <path d="M5 7v4a3 3 0 0 0 6 0V7M19 7v4a3 3 0 0 1-6 0V7" />
        </svg>
      );
    case "post-mortem": // Alert Triangle / Failures
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="17" r="1" fill={strokeColor} />
        </svg>
      );
    case "rtl-to-silicon": // CPU Chip Circuitry
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M9 9h6v6H9z" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case "the-hard-question": // Help Circle / Question mark
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      );
    default:
      return (
        <svg
          className={className}
          viewBox="0 0 24 24"
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
  }
}
