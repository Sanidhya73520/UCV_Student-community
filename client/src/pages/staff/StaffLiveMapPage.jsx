import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Maximize2, Minimize2, ArrowLeft, RefreshCw } from 'lucide-react';
import { WorldMap } from '../../components/WorldMap.jsx';
import { Logos } from '../../components/Logos.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { ErrorAlert } from '../../components/ErrorAlert.jsx';
import { api } from '../../lib/api.js';
import { useLiveMapSync } from '../../lib/mapSync.js';
import { getCountryColor } from '../../../../shared/countryColors.js';

export function StaffLiveMapPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);

  const fetchMapData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const res = await api.get('/staff/live-map');
      setData(res);
    } catch (err) {
      if (!silent) setError(err.message || 'Failed to load live map data.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMapData();
  }, []);

  // Real-time synchronization: sub-millisecond local tab sync + SSE stream
  useLiveMapSync({
    onData: (liveData) => {
      setData(liveData);
      setLoading(false);
      setError(null);
    },
    fallbackFetch: () => fetchMapData(true),
    streamUrl: '/api/staff/live-map/stream'
  });

  // Listen to fullscreen changes (e.g. user pressed Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        setIsFullscreen(true);
      } catch (err) {
        console.error('Fullscreen request failed:', err);
      }
    } else {
      try {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
        setIsFullscreen(false);
      } catch (err) {
        console.error('Exit fullscreen failed:', err);
      }
    }
  };

  if (loading && !data) {
    return (
      <div className="staff-page-container">
        <Skeleton height="40px" width="280px" />
        <Skeleton height="600px" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="staff-page-container">
        <ErrorAlert message={error} onRetry={() => fetchMapData()} />
      </div>
    );
  }

  const {
    totalStudents = 0,
    countriesCount = 0,
    byCountry = [],
    recentlyJoined = []
  } = data || {};

  const newestStudent = recentlyJoined.length > 0 ? recentlyJoined[0] : null;

  return (
    <div
      ref={containerRef}
      className={`staff-live-map-wrapper ${isFullscreen ? 'fullscreen' : ''}`}
      style={{
        backgroundColor: isFullscreen ? '#18203A' : 'transparent',
        minHeight: isFullscreen ? '100vh' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* Top Header */}
      {!isFullscreen ? (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '32px', fontWeight: 800 }}>
              Live map
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '15px' }}>
              Approved members by country. Updates as soon as you approve a student.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to="/staff"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                border: '1.5px solid var(--navy)',
                color: 'var(--navy)',
                fontWeight: 700,
                fontSize: '15px',
                textDecoration: 'none',
                backgroundColor: 'var(--white)'
              }}
            >
              Back to dashboard
            </Link>

            <button
              type="button"
              onClick={toggleFullscreen}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                height: '44px',
                padding: '0 18px',
                borderRadius: '10px',
                backgroundColor: 'var(--brand-red)',
                color: 'var(--white)',
                fontWeight: 700,
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Maximize2 size={18} />
              Show full screen
            </button>
          </div>
        </header>
      ) : (
        /* Fullscreen Bar (Screen 36) */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '80px',
            padding: '0 48px',
            borderBottom: '1px solid #2B3558',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '6px 10px', borderRadius: '10px' }}>
              <Logos width={82} height={48} />
            </div>
            <span style={{ fontSize: '16px', color: '#C9D0E4', fontWeight: 600 }}>
              Live map, shown on screen
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              height: '44px',
              padding: '0 18px',
              borderRadius: '10px',
              backgroundColor: '#FFFFFF',
              color: 'var(--navy)',
              fontWeight: 700,
              fontSize: '15px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            <Minimize2 size={18} />
            Exit full screen
          </button>
        </div>
      )}

      {/* Map View Canvas */}
      <div
        className="staff-live-map-canvas"
        style={{
          borderRadius: isFullscreen ? '0' : '20px',
          overflow: 'hidden',
          backgroundColor: '#18203A',
          color: '#FFFFFF',
          padding: isFullscreen ? '32px 48px 40px' : '36px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {/* Banner with stats */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2
              className="staff-map-heading"
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: isFullscreen ? '48px' : '38px',
                lineHeight: 1.1,
                color: '#FFFFFF'
              }}
            >
              Where we're from
            </h2>
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#C9D0E4', maxWidth: '640px' }}>
              Every approved member adds their country to the map. Numbers show how many of us come from each country.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span
              className="staff-map-stats-num"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '40px',
                lineHeight: 1,
                color: 'var(--marigold)'
              }}
            >
              {totalStudents}
            </span>
            <span style={{ fontSize: '14px', color: '#C9D0E4' }}>
              members from {countriesCount} {countriesCount === 1 ? 'country' : 'countries'}
            </span>
          </div>
        </div>

        {/* World Map Container */}
        <div style={{ position: 'relative', width: '100%', minHeight: '260px', display: 'flex', justifyContent: 'center' }}>
          <WorldMap
            byCountry={byCountry}
            justJoined={newestStudent}
            showJustJoinedCard={false}
            totalStudents={totalStudents}
            countriesCount={countriesCount}
            height={isFullscreen ? 'calc(100vh - 280px)' : 'clamp(280px, 46vh, 520px)'}
          />

          {/* "Just joined" Toast Card */}
          {newestStudent && (
            <div
              className="staff-map-just-joined-card"
              style={{
                position: 'absolute',
                left: '24px',
                bottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: '12px 18px',
                borderRadius: '14px',
                backgroundColor: '#FFFFFF',
                color: 'var(--navy)',
                boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45)',
                zIndex: 10
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Just joined</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '18px', lineHeight: '22px' }}>
                {newestStudent.firstName}, {newestStudent.countryName}
              </span>
            </div>
          )}
        </div>

        {/* By Country Chips */}
        {byCountry.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '15px', color: '#C9D0E4', fontWeight: 600 }}>
              By country ({byCountry.length})
            </span>
            <div className="staff-map-chips-row">
              {byCountry.map((c) => {
                const color = getCountryColor(c.countryCode);
                return (
                  <span
                    key={c.countryCode}
                    className="staff-map-chip"
                    style={{
                      border: `1.5px solid ${color}40`,
                      boxShadow: `0 2px 8px ${color}15`
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
                    <span>{c.countryName}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Joined Chips */}
        {recentlyJoined.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '15px', color: '#C9D0E4', fontWeight: 600 }}>
              Recently joined
            </span>
            <div className="staff-map-chips-row">
              {recentlyJoined.map((r, idx) => (
                <span
                  key={r.id || idx}
                  className="staff-map-chip"
                  style={{
                    backgroundColor: '#2B3558',
                    color: '#FFFFFF',
                    fontWeight: 600
                  }}
                >
                  {r.firstName}, {r.countryName}
                </span>
              ))}
            </div>
          </div>
        )}

        <span style={{ fontSize: '13px', color: '#9AA3BD' }}>
          Only approved members are counted.
        </span>
      </div>

      <style>{`
        .staff-live-map-wrapper {
          padding: 32px 40px;
        }
        .staff-map-chips-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
          max-height: 240px;
          overflow-y: auto;
        }
        .staff-map-chip {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 36px;
          padding: 0 14px;
          border-radius: 999px;
          background-color: #2B3558;
          color: #FFFFFF;
          font-size: 14px;
          flex-shrink: 0;
        }
        @media (max-width: 900px) {
          .staff-live-map-wrapper {
            padding: 0 !important;
            gap: 16px !important;
          }
          .staff-live-map-canvas {
            padding: 20px 14px !important;
            border-radius: 16px !important;
            gap: 16px !important;
          }
          .staff-map-heading {
            font-size: 26px !important;
          }
          .staff-map-stats-num {
            font-size: 32px !important;
          }
          .staff-map-just-joined-card {
            left: 10px !important;
            bottom: 10px !important;
            padding: 8px 12px !important;
            max-width: calc(100% - 20px) !important;
            border-radius: 10px !important;
          }
          .staff-map-chip {
            height: 30px !important;
            padding: 0 10px !important;
            font-size: 12px !important;
            gap: 6px !important;
          }
        }
      `}</style>
    </div>
  );
}
