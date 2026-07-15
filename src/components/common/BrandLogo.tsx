import React from 'react';

import { useAgencyStore } from '@/store/agencyStore';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: number;
  className?: string;
  badgeText?: string;
  stacked?: boolean;
  lightText?: boolean;
  forceOriginalBranding?: boolean;
}

/**
 * BrandLogo — BussManager Enterprise OS
 * Features an ultra-creative, high-taste "Interlocking Architectural Ribbon B"
 * Designed with geometric precision, subtle depth, and timeless Sagi Haviv / Paul Rand proportions.
 * Looks breathtaking in both Light Mode and Dark Mode!
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 40,
  showText = true,
  textSize = 22,
  className = '',
  badgeText = 'ENTERPRISE',
  stacked = false,
  lightText = false,
  forceOriginalBranding = false,
}) => {
  const { agencyName, agencyLogo } = useAgencyStore();

  const displayAgencyName = forceOriginalBranding ? null : agencyName;
  const displayAgencyLogo = forceOriginalBranding ? null : agencyLogo;

  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: stacked ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: stacked ? 'center' : 'flex-start',
        gap: stacked ? 14 : 12,
        userSelect: 'none',
        cursor: 'pointer',
      }}
    >
      {/* If agencyLogo exists, show it instead of the SVG ribbon */}
      {displayAgencyLogo ? (
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <img src={displayAgencyLogo} alt="Agency Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
        </div>
      ) : (
        /* The "Interlocking Ribbon B" — Sculpture-like architectural geometry
           with subtle gradient shading and kinetic flow curves. */
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative',
          }}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="primaryRibbon" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="accentRibbon" x1="90" y1="10" x2="10" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter id="subtleShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#10b981" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Outer Rounded Container with subtle depth */}
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              rx="24"
              fill="url(#primaryRibbon)"
              filter="url(#subtleShadow)"
            />

            {/* Precision Architectural Weave — Interlocking 'B' & Data Flow */}
            <path
              d="M32 26 V74 M32 26 H56 C65 26 72 32 72 40 C72 47 67 51 58 52 C68 53 74 58 74 67 C74 76 66 82 56 82 H32"
              stroke="#ffffff"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Kinetic Ascending Arrow / Portal Node */}
            <path
              d="M50 44 L60 52 L50 60"
              stroke="#a7f3d0"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Paul Rand Focus Node */}
            <circle cx="74" cy="26" r="5" fill="#fef08a" />
          </svg>
        </div>
      )}

      {/* High-Taste Editorial Typography */}
      {showText && (
        <div
          style={{
            display: 'flex',
            flexDirection: stacked ? 'column' : 'row',
            alignItems: stacked ? 'center' : 'baseline',
            gap: stacked ? 4 : 8,
          }}
        >
          {displayAgencyName ? (
            <span
              style={{
                fontSize: textSize,
                fontWeight: 700,
                color: lightText ? '#a7f3d0' : '#10b981', // green color
                fontFamily: 'var(--font-sans)',
                lineHeight: 1,
                letterSpacing: '-0.02em',
              }}
            >
              {displayAgencyName}
            </span>
          ) : (
            <div style={{ display: 'flex', alignItems: 'baseline', letterSpacing: '-0.04em' }}>
              <span
                style={{
                  fontSize: textSize,
                  fontWeight: 800,
                  color: lightText ? '#ffffff' : 'var(--text-primary)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1,
                }}
              >
                Buss
              </span>
              <span
                style={{
                  fontSize: textSize,
                  fontWeight: 400,
                  color: lightText ? '#cbd5e1' : 'var(--text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 1,
                }}
              >
                Manager
              </span>
            </div>
          )}

          {badgeText && (
            <span
              style={{
                fontSize: Math.max(9, Math.round(textSize * 0.4)),
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10b981',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                alignSelf: stacked ? 'center' : 'center',
              }}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
