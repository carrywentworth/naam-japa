function OmSymbol({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
    >
      <text
        x="50"
        y="72"
        textAnchor="middle"
        fontSize="72"
        fontFamily="serif"
        fill="currentColor"
      >
        ॐ
      </text>
    </svg>
  );
}

export default OmSymbol;
