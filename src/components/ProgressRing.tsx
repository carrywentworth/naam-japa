function ProgressRing({
  progress,
  size = 240,
  strokeWidth = 4,
  showBeads = false,
  totalBeads = 27,
  filledBeads = 0,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  showBeads?: boolean;
  totalBeads?: number;
  filledBeads?: number;
}) {
  const radius = (size - strokeWidth * 2 - (showBeads ? 20 : 0)) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;
  const center = size / 2;

  const beadRadius = showBeads ? (size - 12) / 2 : 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <defs>
        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-light)" />
        </linearGradient>
        <filter id="ringGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="var(--ring-track)"
        strokeWidth={strokeWidth}
        fill="none"
      />

      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke="url(#progressGrad)"
        strokeWidth={strokeWidth + 1}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        filter={progress > 0 ? 'url(#ringGlow)' : undefined}
        className="transition-all duration-700 ease-out"
      />

      {showBeads &&
        Array.from({ length: totalBeads }).map((_, i) => {
          const angle = (i / totalBeads) * Math.PI * 2 - Math.PI / 2;
          const bx = center + beadRadius * Math.cos(angle);
          const by = center + beadRadius * Math.sin(angle);
          const isFilled = i < filledBeads;

          return (
            <circle
              key={i}
              cx={bx}
              cy={by}
              r={2.5}
              fill={isFilled ? 'var(--accent)' : 'var(--ring-track)'}
              className="transition-all duration-300"
            />
          );
        })}
    </svg>
  );
}

export default ProgressRing;
