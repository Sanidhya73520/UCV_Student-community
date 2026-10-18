import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { WorldMap } from '../../components/WorldMap.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useLiveMapSync } from '../../lib/mapSync.js';
import { getCountryColor } from '../../../../shared/countryColors.js';

export function MapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMap = async () => {
    try {
      const res = await api.get('/public/map');
      setData(res);
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMap();
  }, []);

  // Real-time sync: sub-millisecond local tab sync + SSE stream
  useLiveMapSync({
    onData: (liveData) => {
      setData(liveData);
      setLoading(false);
    },
    fallbackFetch: fetchMap,
    streamUrl: '/api/public/map/stream'
  });

  const totalStudents = data?.totalStudents || 0;
  const countriesCount = data?.countriesCount || 0;
  const byCountry = data?.byCountry || [];
  const recentlyJoined = data?.recentlyJoined || [];
  const justJoined = data?.justJoined || null;

  return (
    <div
      className="map-page-container"
      style={{
        backgroundColor: '#18203A',
        color: '#FFFFFF',
        minHeight: 'calc(100vh - 112px)',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px 56px'
      }}
    >
      <div
        style={{
          maxWidth: '1328px',
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Header with Title and Big Stat */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: '24px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: 'clamp(32px, 4vw, 52px)',
                lineHeight: 1.1,
                letterSpacing: '-1px',
                color: '#FFFFFF'
              }}
            >
              Where we're from
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: '17px',
                lineHeight: '26px',
                color: '#C9D0E4',
                maxWidth: '700px'
              }}
            >
              Every approved member adds their country to the map.
            </p>

            {/* Mobile stat on top matching M7 */}
            <div className="mobile-only" style={{ marginTop: '10px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '42px',
                  lineHeight: '42px',
                  color: '#F2B705',
                  marginRight: '10px'
                }}
              >
                {totalStudents}
              </span>
              <span style={{ fontSize: '16px', color: '#C9D0E4' }}>
                members from {countriesCount} {countriesCount === 1 ? 'country' : 'countries'}
              </span>
            </div>
          </div>

          <div className="desktop-only" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '44px',
                lineHeight: '44px',
                color: '#F2B705'
              }}
            >
              {totalStudents}
            </span>
            <span style={{ fontSize: '15px', color: '#C9D0E4' }}>
              members from {countriesCount} {countriesCount === 1 ? 'country' : 'countries'}
            </span>
          </div>
        </div>

        {/* Map Container */}
        {loading ? (
          <Skeleton height="515px" style={{ borderRadius: '24px', backgroundColor: '#202A4A' }} />
        ) : (
          <WorldMap
            byCountry={byCountry}
            justJoined={justJoined}
            totalStudents={totalStudents}
            countriesCount={countriesCount}
            showJustJoinedCard={true}
            height="515px"
          />
        )}

        {/* By Country Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#C9D0E4' }}>By country</span>
          <div className="horizontal-scroll-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {byCountry.length === 0 && !loading && (
              <span style={{ fontSize: '15px', color: '#8E99B7' }}>No members yet</span>
            )}
            {byCountry.map((c) => {
              const color = getCountryColor(c.countryCode);
              return (
                <span
                  key={c.countryCode}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '40px',
                    padding: '0 14px',
                    borderRadius: '999px',
                    background: '#2B3558',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    border: `1.5px solid ${color}40`,
                    boxShadow: `0 2px 8px ${color}15`,
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: color,
                      flexShrink: 0
                    }}
                  />
                  <strong style={{ color }}>{c.count}</strong>
                  {c.countryName}
                </span>
              );
            })}
          </div>
        </div>

        {/* Recently Joined Chips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: '#C9D0E4' }}>Recently joined</span>
          <div className="horizontal-scroll-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {recentlyJoined.length === 0 && !loading && (
              <span style={{ fontSize: '15px', color: '#8E99B7' }}>No recently joined members</span>
            )}
            {recentlyJoined.map((m, idx) => (
              <span
                key={m.id || idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: '40px',
                  padding: '0 16px',
                  borderRadius: '999px',
                  background: '#2B3558',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {m.firstName}, {m.countryName}
              </span>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link
            to="/signup"
            className="map-add-country-btn"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '52px',
              padding: '0 28px',
              borderRadius: '12px',
              background: '#F2B705',
              color: '#18203A',
              fontWeight: 800,
              fontSize: '16px',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(242, 183, 5, 0.3)',
              transition: 'transform 150ms ease'
            }}
          >
            Add your country
          </Link>
        </div>

        <span style={{ fontSize: '14px', color: '#9AA3BD' }}>
          Only approved members are counted.
        </span>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .map-page-container {
            padding: 24px 16px 40px !important;
          }
          .map-add-country-btn {
            width: 100% !important;
            display: flex !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
    </div>
  );
}
