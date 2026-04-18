import { useId } from 'react'

interface LyraLogoProps {
  size?: number
  dim?: boolean
  glow?: boolean
}

export default function LyraLogo({ size = 28, dim = false, glow = true }: LyraLogoProps) {
  const rawId = useId()
  const glowFilterId = `lyra-vega-glow-${rawId}`

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      style={{ opacity: dim ? 0.18 : 1, flexShrink: 0 }}
    >
      <defs>
        {glow && (
          <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        )}
      </defs>
      {/* Constellation lines */}
      <g stroke="#b0864f" strokeWidth="0.35" strokeLinejoin="round" strokeLinecap="round" opacity="0.85">
        <path d="M4.3 19.88 L9.82 20.03 L17.46 10.4 L12.23 10.06 L4.3 19.88 Z" />
        <path d="M22.8 9.12 L19.98 5.28 L17.46 10.4 L22.8 9.12 Z" />
      </g>
      {/* Stars */}
      <g fill="#FCE7C1">
        <circle cx="4.3" cy="20.25" r="0.7" />
        <circle cx="9.83" cy="20.4" r="0.7" />
        <circle cx="12.23" cy="10.06" r="0.62" />
        <circle cx="17.46" cy="10.4" r="0.62" />
        <circle cx="19.97" cy="5.28" r="0.62" />
      </g>
      {/* Vega — brightest */}
      {glow && (
        <circle cx="22.83" cy="9.12" r="2.4" fill="#FFBB41" opacity="0.28" filter={`url(#${glowFilterId})`} />
      )}
      <circle cx="22.83" cy="9.12" r="1.15" fill="#FCE7C1" />
    </svg>
  )
}
