import React, { useMemo } from 'react';
import mapData from '../assets/map-dots.json';
import { getCountryColor } from '../../../shared/countryColors.js';

/**
 * Reusable Dotted World Map component.
 * Used on Public Map (/map), Home page if desired, and Staff Live Map (/staff/live-map).
 */
export function WorldMap({
  byCountry = [], // [{ countryCode: 'ES', count: 26 }, ...]
  countries = [], // fallback alias for byCountry
  justJoined = null, // { firstName: 'Lucía', countryName: 'Spain' }
  totalStudents = 0,
  countriesCount = 0,
  showJustJoinedCard = true,
  showTopStats = false,
  countryColors = null, // Optional custom color overrides for future preferences
  height = '520px',
  style = {}
}) {
  const { width, height: mapHeight, craiova, centers, dots } = mapData;

  const activeCountries = (byCountry && byCountry.length > 0) ? byCountry : countries;

  // Map countryCode -> count
  const countryCounts = useMemo(() => {
    const map = {};
    for (const item of activeCountries) {
      if (item.countryCode) {
        map[item.countryCode.toUpperCase().trim()] = item.count;
      }
    }
    return map;
  }, [activeCountries]);

  // Compute radius for circle bubble based on count
  const getBubbleRadius = (count) => {
    if (!count || count <= 0) return 0;
    if (count === 1) return 12;
    if (count < 5) return 14;
    if (count < 15) return 17;
    if (count < 30) return 20;
    return 24;
  };

  return (
    <div
      className="world-map-wrapper"
      style={{
        position: 'relative',
        width: '100%',
        backgroundColor: 'var(--navy)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        ...style
      }}
    >
      {/* Top Map Stats Bar (optional if host page does not show it) */}
      {showTopStats && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '24px',
            zIndex: 10,
            textAlign: 'right'
          }}
        >
          <div
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              color: 'var(--marigold)',
              fontFamily: 'var(--font-heading)',
              lineHeight: 1
            }}
          >
            {totalStudents}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#C3C9D6', fontWeight: 600 }}>
            members from {countriesCount} {countriesCount === 1 ? 'country' : 'countries'}
          </div>
        </div>
      )}

      {/* SVG Canvas */}
      <div className="world-map-canvas-container" style={{ width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg
          viewBox={`0 0 ${width} ${mapHeight}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
          aria-label="World map showing member distribution"
        >
          {/* Base and highlighted country dots */}
          <g id="map-dots">
            {dots.map((dot, i) => {
              const count = dot.c ? countryCounts[dot.c] : 0;
              const isColored = count > 0;
              const dotColor = isColored ? getCountryColor(dot.c, countryColors) : '#2C3859';

              return (
                <circle
                  key={i}
                  cx={dot.x}
                  cy={dot.y}
                  r={isColored ? 2.6 : 1.8}
                  fill={dotColor}
                  opacity={isColored ? 1 : 0.65}
                  style={{
                    transition: 'fill 300ms ease, r 300ms ease'
                  }}
                />
              );
            })}
          </g>

          {/* Craiova Marker */}
          {craiova && (
            <g id="craiova-marker">
              {/* Outer pulsing ring */}
              <circle
                cx={craiova.x}
                cy={craiova.y}
                r="7"
                fill="none"
                stroke="var(--marigold)"
                strokeWidth="1.5"
                opacity="0.8"
              />
              {/* Core dot */}
              <circle
                cx={craiova.x}
                cy={craiova.y}
                r="3.5"
                fill="var(--marigold)"
              />
              {/* Label */}
              <text
                x={craiova.x + 8}
                y={craiova.y + 4}
                fill="var(--marigold)"
                fontSize="11"
                fontWeight="700"
                fontFamily="var(--font-heading)"
              >
                Craiova
              </text>
            </g>
          )}

          {/* Country count bubbles */}
          <g id="country-bubbles">
            {Object.entries(countryCounts).map(([code, count]) => {
              if (count <= 0) return null;
              const normalizedCode = code.toUpperCase().trim();
              let center = centers[normalizedCode] || centers[code];

              // Infallible fallback: find any dot tagged with this country
              if (!center) {
                const dot = dots.find((d) => d.c && d.c.toUpperCase() === normalizedCode);
                if (dot) {
                  center = { x: dot.x, y: dot.y };
                }
              }

              if (!center) return null;

              const r = getBubbleRadius(count);
              const bubbleColor = getCountryColor(normalizedCode, countryColors);
              const isJustJoined = justJoined && (
                justJoined.countryCode?.toUpperCase() === normalizedCode ||
                justJoined.countryName?.toLowerCase() === code.toLowerCase()
              );

              return (
                <g key={normalizedCode} className="country-bubble-group">
                  {/* Glowing pulse ring for recently joined member's country */}
                  {isJustJoined && (
                    <circle
                      cx={center.x}
                      cy={center.y}
                      r={r + 8}
                      fill="none"
                      stroke={bubbleColor}
                      strokeWidth="2.5"
                      opacity="0.85"
                      style={{
                        animation: 'pulse 1.8s infinite ease-in-out'
                      }}
                    />
                  )}

                  {/* Main Bubble Circle */}
                  <circle
                    cx={center.x}
                    cy={center.y}
                    r={r}
                    fill={bubbleColor}
                    stroke="var(--navy)"
                    strokeWidth="2"
                    style={{
                      filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.45))',
                      transition: 'all 300ms ease'
                    }}
                  />
                  {/* Number text */}
                  <text
                    x={center.x}
                    y={center.y + 4}
                    textAnchor="middle"
                    fill="var(--white)"
                    fontSize={r >= 20 ? '12' : '10'}
                    fontWeight="700"
                    fontFamily="var(--font-heading)"
                  >
                    {count}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* "Just joined" card */}
      {showJustJoinedCard && justJoined && (
        <div
          className="world-map-just-joined"
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '24px',
            zIndex: 10,
            backgroundColor: 'var(--white)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 18px',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            animation: 'fadeIn 300ms ease'
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--green)'
            }}
          />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Just joined
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--navy)' }}>
              {justJoined.firstName}, {justJoined.countryName}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .world-map-wrapper .world-map-canvas-container {
            height: 280px !important;
          }
          .world-map-just-joined {
            position: static !important;
            margin: 12px 14px 14px !important;
            width: calc(100% - 28px) !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
