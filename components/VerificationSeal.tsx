// The brand's signature element: a circular stamp with a checkmark.
// Outer gold dashed ring, inner green disc, white check.

export function VerificationSeal({ size = 96, label }: { size?: number; label?: string }) {
  const id = `seal-${size}`;
  return (
    <div className="inline-flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 100 100" role="img" aria-label={label ?? "Verification seal"}>
        {/* Outer gold dashed ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="#C8941E"
          strokeWidth="3"
          strokeDasharray="4 4"
        />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#C8941E" strokeWidth="1.5" opacity="0.6" />
        {/* Inner green disc */}
        <circle cx="50" cy="50" r="33" fill={`url(#${id})`} />
        <defs>
          <radialGradient id={id} cx="0.4" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="#0FA255" />
            <stop offset="100%" stopColor="#063D21" />
          </radialGradient>
        </defs>
        {/* White check */}
        <path
          d="M37 51 L46 60 L65 39"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label ? <span className="text-xs font-semibold uppercase tracking-wide text-gold">{label}</span> : null}
    </div>
  );
}
