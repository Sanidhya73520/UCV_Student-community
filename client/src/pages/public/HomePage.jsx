import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Calendar,
  Users,
  Award,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  Activity,
  Music,
  Palette,
  Camera,
  Dices,
  Film,
  BookOpen,
  Code,
  TrendingUp,
  MessageSquare,
  Heart,
  Sun,
  Building2,
  Mail,
  Globe2,
  CheckCircle2,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Button } from '../../components/Button.jsx';
import { Card } from '../../components/Card.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';
import { api } from '../../lib/api.js';
import { useAuth } from '../../context/AuthContext.jsx';

// Visual themes for the 13 community clubs
const CLUB_THEMES = {
  'sports and fitness': { icon: Activity, color: '#15803D', bg: '#DCFCE7', border: '#BBF7D0', label: 'Sports & Active' },
  'music / dance': { icon: Music, color: '#7E22CE', bg: '#F3E8FF', border: '#E9D5FF', label: 'Music & Arts' },
  'art and drawing': { icon: Palette, color: '#C2410C', bg: '#FFEDD5', border: '#FED7AA', label: 'Creative' },
  'photography and video': { icon: Camera, color: '#0369A1', bg: '#E0F2FE', border: '#BAE6FD', label: 'Media' },
  'board games and card games': { icon: Dices, color: '#B45309', bg: '#FEF3C7', border: '#FDE68A', label: 'Social Games' },
  'movies and series': { icon: Film, color: '#BE123C', bg: '#FFE4E6', border: '#FECDD3', label: 'Cinema' },
  'reading/writing/literature': { icon: BookOpen, color: '#0F766E', bg: '#CCFBF1', border: '#99F6E4', label: 'Literature' },
  'travel and day trips': { icon: MapPin, color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE', label: 'Exploration' },
  'tech and coding': { icon: Code, color: '#4338CA', bg: '#EEF2FF', border: '#C7D2FE', label: 'Technology' },
  'entrepreneurship': { icon: TrendingUp, color: '#92400E', bg: '#FEF3C7', border: '#FDE68A', label: 'Innovation' },
  'debates and discussions': { icon: MessageSquare, color: '#6D28D9', bg: '#EDE9FE', border: '#DDD6FE', label: 'Discourse' },
  'volunteering': { icon: Heart, color: '#B91C1C', bg: '#FEE2E2', border: '#FECACA', label: 'Community' },
  'yoga and wellbeing': { icon: Sun, color: '#047857', bg: '#D1FAE5', border: '#A7F3D0', label: 'Wellbeing' }
};

function getClubTheme(name) {
  const key = (name || '').toLowerCase().trim();
  return (
    CLUB_THEMES[key] || {
      icon: Sparkles,
      color: '#18203A',
      bg: '#E4E9F4',
      border: '#D9DDE6',
      label: 'Interest'
    }
  );
}

export function HomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upvotedIds, setUpvotedIds] = useState(new Set());
  const { isStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchHome() {
      try {
        const [homeData, votesData] = await Promise.all([
          api.get('/public/home'),
          api.get('/public/votes/mine').catch(() => ({ upvotedAreaIds: [] }))
        ]);
        setData(homeData);
        setUpvotedIds(new Set(votesData?.upvotedAreaIds || []));
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHome();
  }, []);

  const handleUpvote = async (areaId) => {
    try {
      const res = await api.post('/public/upvotes/toggle', { clubAreaId: areaId });
      if (res) {
        setUpvotedIds((prev) => {
          const next = new Set(prev);
          if (res.upvoted) next.add(areaId);
          else next.delete(areaId);
          return next;
        });

        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            clubAreas: prev.clubAreas.map((a) =>
              a.id === areaId ? { ...a, upvoteCount: res.upvoteCount } : a
            )
          };
        });
      }
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const scrollToExplore = () => {
    const el = document.getElementById('start-here');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const settings = data?.settings || {};
  const clubAreas = data?.clubAreas || [];
  const upcoming = data?.upcomingActivities || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', overflowX: 'hidden' }}>
      {/* 1. Hero First Screen: Matches UCV-home-first-screen.html exactly */}
      <section
        aria-label="Welcome"
        data-fullscreen="100vh"
        className="home-hero-section"
        style={{
          position: 'relative',
          height: 'calc(100vh - 28px)',
          minHeight: '640px',
          flexShrink: 0,
          overflow: 'hidden',
          backgroundColor: 'rgb(24, 32, 58)'
        }}
      >
        {/* Full Hero Photo: 50% 62% object-position matching UCV-home-first-screen.html */}
        <img
          src="/brand/home-hero-photo.jpg"
          alt="International students of the University of Craiova together with the university flag"
          className="hero-photo-elem"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: '50% 62%',
            zIndex: 1
          }}
        />

        {/* Dual Radial + Linear Gradient Overlay from UCV-home-first-screen.html */}
        <div
          aria-hidden="true"
          className="hero-gradient-overlay"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(560px 230px at 0px 20px, rgba(246, 247, 250, 0.9) 0%, rgba(246, 247, 250, 0.8) 40%, rgba(246, 247, 250, 0.4) 70%, rgba(246, 247, 250, 0) 100%), linear-gradient(rgba(16, 24, 48, 0.86) 0%, rgba(16, 24, 48, 0.74) 22%, rgba(16, 24, 48, 0.5) 42%, rgba(16, 24, 48, 0.18) 60%, rgba(16, 24, 48, 0.12) 78%, rgba(16, 24, 48, 0.62) 100%)',
            zIndex: 2,
            pointerEvents: 'none'
          }}
        />

        {/* Hero Content Block */}
        <div
          className="hero-text-content"
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '14px',
            padding: '150px 64px 0px',
            textAlign: 'center',
            color: 'rgb(255, 255, 255)'
          }}
        >
          <span
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'rgb(242, 183, 5)'
            }}
          >
            {settings.welcomeLine || 'Welcome to the University of Craiova'}
          </span>

          <h1
            className="hero-headline-title"
            style={{
              margin: '0px',
              fontFamily: '"Bricolage Grotesque", "Trebuchet MS", sans-serif',
              fontWeight: 800,
              fontSize: 'clamp(2.1rem, 5.2vw, 76px)',
              lineHeight: 'clamp(40px, 5.7vw, 82px)',
              letterSpacing: '-2px',
              color: 'rgb(255, 255, 255)',
              textShadow: 'rgba(0, 0, 0, 0.3) 0px 2px 20px'
            }}
          >
            {settings.headline || 'Meet. Connect. Belong.'}
          </h1>

          <p
            className="hero-subtitle-text"
            style={{
              margin: '4px 0px 0px',
              fontSize: 'clamp(1rem, 1.35vw, 19px)',
              lineHeight: '28px',
              color: 'rgb(228, 233, 244)'
            }}
          >
            {settings.subline || 'This is your community. Find your people and make Craiova feel like home.'}
          </p>
        </div>

        {/* Scroll to explore link and button */}
        <a
          href="#start-here"
          onClick={(e) => {
            e.preventDefault();
            scrollToExplore();
          }}
          aria-label="Scroll down to learn more"
          style={{
            position: 'absolute',
            left: '50%',
            bottom: '30px',
            transform: 'translateX(-50%)',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            color: 'rgb(255, 255, 255)',
            cursor: 'pointer'
          }}
        >
          <span
            style={{
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              textShadow: 'rgba(0, 0, 0, 0.5) 0px 1px 8px'
            }}
          >
            Scroll to explore
          </span>
          <span
            className="scroll-chevron-bubble"
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              border: '2px solid rgb(242, 183, 5)',
              background: 'rgba(24, 32, 58, 0.55)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgb(242, 183, 5)'
            }}
          >
            <ArrowDown size={22} strokeWidth={2.4} />
          </span>
        </a>

        {/* Responsive adjustments & micro-interactions */}
        <style>{`
          @keyframes gentleBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(6px); }
          }
          .scroll-chevron-bubble {
            animation: gentleBounce 2.4s infinite ease-in-out;
          }
          @media (max-width: 900px) {
            .home-hero-section {
              height: 100svh !important;
              min-height: 560px !important;
            }
            .hero-photo-elem {
              object-position: 50% 88% !important;
            }
            .hero-gradient-overlay {
              background: linear-gradient(180deg, rgba(246, 247, 250, 0.94) 0%, rgba(246, 247, 250, 0.72) 14%, rgba(16, 24, 48, 0.78) 28%, rgba(16, 24, 48, 0.52) 52%, rgba(16, 24, 48, 0.08) 74%, rgba(16, 24, 48, 0.48) 100%) !important;
            }
            .hero-text-content {
              padding: 96px 16px 0px !important;
              gap: 8px !important;
            }
            .hero-headline-title {
              font-size: clamp(2rem, 8vw, 2.4rem) !important;
              line-height: 1.15 !important;
              letter-spacing: -1px !important;
            }
            .hero-subtitle-text {
              font-size: 0.95rem !important;
              line-height: 22px !important;
              max-width: 320px !important;
            }
            .home-section-pad {
              padding: 44px 16px !important;
            }
            .home-grid-stack {
              grid-template-columns: 1fr !important;
              gap: 16px !important;
            }
          }

          /* Refined visual styles for content sections below hero */
          .refined-start-card {
            background-color: #FFFFFF;
            border-radius: 20px;
            border: 1px solid rgba(217, 221, 230, 0.85);
            box-shadow: 0 4px 20px -2px rgba(24, 32, 58, 0.05), 0 1px 3px rgba(24, 32, 58, 0.04);
            transition: all 260ms cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
          }
          .refined-start-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 18px 36px -6px rgba(24, 32, 58, 0.12), 0 4px 12px -2px rgba(24, 32, 58, 0.06);
            border-color: rgba(24, 32, 58, 0.22);
          }
          .refined-start-card:hover .card-action-arrow {
            transform: translateX(5px);
          }
          .card-action-arrow {
            transition: transform 220ms ease;
          }

          .refined-club-card {
            background-color: #FFFFFF;
            border-radius: 16px;
            border: 1px solid #E2E6EE;
            box-shadow: 0 2px 10px rgba(24, 32, 58, 0.035);
            transition: all 240ms cubic-bezier(0.16, 1, 0.3, 1);
          }
          .refined-club-card:hover {
            transform: translateY(-3px);
            border-color: #CBD5E1;
            box-shadow: 0 12px 28px -4px rgba(24, 32, 58, 0.09), 0 2px 6px rgba(24, 32, 58, 0.04);
          }

          .refined-activity-card {
            background-color: #FFFFFF;
            border-radius: 18px;
            border: 1px solid #E2E6EE;
            box-shadow: 0 3px 14px rgba(24, 32, 58, 0.04);
            transition: all 240ms ease;
          }
          .refined-activity-card:hover {
            transform: translateY(-2px);
            border-color: #CBD5E1;
            box-shadow: 0 14px 30px -4px rgba(24, 32, 58, 0.09);
          }

          .pulse-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background-color: #1E7B4C;
            display: inline-block;
            box-shadow: 0 0 0 0 rgba(30, 123, 76, 0.7);
            animation: pulseGreen 2s infinite;
          }
          @keyframes pulseGreen {
            0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(30, 123, 76, 0.7); }
            70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(30, 123, 76, 0); }
            100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(30, 123, 76, 0); }
          }
        `}</style>
      </section>

      {/* 2. Campus Highlights Ribbon: Connects hero to content */}
      <section
        aria-label="Community Highlights"
        className="desktop-only"
        style={{
          backgroundColor: '#18203A',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '20px 24px',
          color: '#FFFFFF'
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(242, 183, 5, 0.18)',
                color: '#F2B705',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Globe2 size={20} />
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>40+ Nationalities</div>
              <div style={{ fontSize: '12px', color: '#B6C2DE' }}>Diverse global student community</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#E4E9F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Building2 size={20} />
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>University of Craiova</div>
              <div style={{ fontSize: '12px', color: '#B6C2DE' }}>Historic center of Oltenia</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(30, 123, 76, 0.25)',
                color: '#4ADE80',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={20} />
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Clubs to explore</div>
              <div style={{ fontSize: '12px', color: '#B6C2DE' }}>Built around your real interests</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'rgba(180, 35, 24, 0.25)',
                color: '#F87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={20} />
            </span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>Welcome Evenings & Trips</div>
              <div style={{ fontSize: '12px', color: '#B6C2DE' }}>Weekly activities & buddy support</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Section: START HERE */}
      <section
        id="start-here"
        className="home-section-pad"
        style={{
          background: 'linear-gradient(180deg, #F8FAFD 0%, #F1F4F9 100%)',
          borderBottom: '1px solid rgba(217, 221, 230, 0.8)',
          padding: '88px 24px 80px'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          {/* Section Header with pill badge */}
          <div style={{ marginBottom: '40px', maxWidth: '780px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '999px',
                backgroundColor: '#FBEAE8',
                border: '1px solid rgba(180, 35, 24, 0.2)',
                marginBottom: '14px'
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--red)' }} />
              <span
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  color: 'var(--red)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                ORIENTATION & GETTING STARTED
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(2.1rem, 3.4vw, 2.75rem)',
                margin: '0 0 10px',
                color: 'var(--navy)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                letterSpacing: '-0.8px',
                lineHeight: 1.15
              }}
            >
              Welcome to your new semester
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '28px', margin: 0 }}>
              Three essential steps to set up your student life in Craiova, connect with peers from across the world, and make the most of your international journey.
            </p>
          </div>

          {/* 3 Refined Feature Cards */}
          <div
            className="home-grid-stack"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px'
            }}
          >
            {/* Card 1: I'm new at UCV */}
            <Link to="/signup" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="refined-start-card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px 30px'
                }}
              >
                {/* Top Accent Stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #B42318 0%, #FF6B57 100%)'
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#FBEAE8',
                        color: 'var(--red)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(180, 35, 24, 0.15)',
                        boxShadow: '0 2px 8px rgba(180, 35, 24, 0.08)'
                      }}
                    >
                      <Compass size={28} strokeWidth={2.2} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--red)',
                        backgroundColor: '#FBEAE8',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      STEP 01 • ONBOARDING
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.45rem',
                      marginBottom: '10px',
                      color: 'var(--navy)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800
                    }}
                  >
                    I’m new at UCV
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.55, fontSize: '0.975rem', marginBottom: '20px' }}>
                    Join our official international student network, mark your country on the community map, and get invited to the semester welcome evening.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '12px', backgroundColor: '#F8F9FC', border: '1px solid #E8EBF2', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Add your home country to our live map</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Receive official welcome event invitation</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Connect with domestic buddies & mentors</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--red)',
                    fontWeight: 700,
                    fontSize: '15px'
                  }}
                >
                  <span>Create your student account</span>
                  <ArrowRight size={18} className="card-action-arrow" />
                </div>
              </div>
            </Link>

            {/* Card 2: Find your people */}
            <Link to="/clubs" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="refined-start-card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px 30px'
                }}
              >
                {/* Top Accent Stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #18203A 0%, #3B82F6 100%)'
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#E4E9F4',
                        color: 'var(--navy)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(24, 32, 58, 0.15)',
                        boxShadow: '0 2px 8px rgba(24, 32, 58, 0.08)'
                      }}
                    >
                      <Users size={28} strokeWidth={2.2} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: 'var(--navy)',
                        backgroundColor: '#E4E9F4',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      STEP 02 • COMMUNITY
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.45rem',
                      marginBottom: '10px',
                      color: 'var(--navy)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800
                    }}
                  >
                    Find your people
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.55, fontSize: '0.975rem', marginBottom: '20px' }}>
                    Our student clubs are shaped right now by what you love. Upvote 13 interest areas or propose a new club to lead with fellow students.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '12px', backgroundColor: '#F8F9FC', border: '1px solid #E8EBF2', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>13 interest areas ready for your vote</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Propose your own club with staff support</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Regular weekend meetups, trips & sports</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--navy)',
                    fontWeight: 700,
                    fontSize: '15px'
                  }}
                >
                  <span>Vote for clubs & interests</span>
                  <ArrowRight size={18} className="card-action-arrow" />
                </div>
              </div>
            </Link>

            {/* Card 3: Become an ambassador */}
            <Link to="/ambassadors" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div
                className="refined-start-card"
                style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '36px 30px'
                }}
              >
                {/* Top Accent Stripe */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #F2B705 0%, #D97706 100%)'
                  }}
                />

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '16px',
                        backgroundColor: '#FEF3D6',
                        color: '#92400E',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(242, 183, 5, 0.3)',
                        boxShadow: '0 2px 8px rgba(242, 183, 5, 0.12)'
                      }}
                    >
                      <Award size={28} strokeWidth={2.2} />
                    </div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#92400E',
                        backgroundColor: '#FEF3D6',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase'
                      }}
                    >
                      STEP 03 • LEADERSHIP
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.45rem',
                      marginBottom: '10px',
                      color: 'var(--navy)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 800
                    }}
                  >
                    Become an ambassador
                  </h3>
                  <p style={{ color: 'var(--text-muted)', lineHeight: 1.55, fontSize: '0.975rem', marginBottom: '20px' }}>
                    Welcome newcomers, organize trips and cultural events, and gain verifiable international leadership credentials for your CV.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', borderRadius: '12px', backgroundColor: '#F8F9FC', border: '1px solid #E8EBF2', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Official university ambassador recognition</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Co-lead semester activities & excursions</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#2E3650' }}>
                      <CheckCircle2 size={15} color="#1E7B4C" />
                      <span>Certificate of Volunteering</span>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#92400E',
                    fontWeight: 700,
                    fontSize: '15px'
                  }}
                >
                  <span>See the ambassador programme</span>
                  <ArrowRight size={18} className="card-action-arrow" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. Section: SUPPORT YOUR INTEREST • SHAPE OUR CLUBS */}
      {clubAreas.length > 0 && (
        <section
          className="home-section-pad"
          style={{
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E6EE',
            padding: '92px 24px 88px'
          }}
        >
          <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
            {/* Header with Call to Action */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '40px'
              }}
            >
              <div style={{ maxWidth: '780px' }}>
                <div
                  id="support-your-interest"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    backgroundColor: '#E8F5EE',
                    border: '1px solid rgba(30, 123, 76, 0.25)',
                    marginBottom: '14px'
                  }}
                >
                  <Sparkles size={14} color="#1E7B4C" />
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: '#17633D',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase'
                    }}
                  >
                    SUPPORT YOUR INTEREST • SHAPE OUR CLUBS
                  </span>
                </div>

                <h2
                  style={{
                    fontSize: 'clamp(2.1rem, 3.4vw, 2.75rem)',
                    margin: '0 0 10px',
                    color: 'var(--navy)',
                    fontFamily: 'var(--font-heading)',
                    fontWeight: 800,
                    letterSpacing: '-0.8px',
                    lineHeight: 1.15
                  }}
                >
                  Which clubs should exist?
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '28px', margin: 0 }}>
                  Our clubs are community-driven. Upvote the activities you’d join (no login required) or submit your own idea. The most requested clubs will be launched first with full university support.
                </p>
              </div>

              <Link to="/clubs" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    height: '46px',
                    padding: '0 20px',
                    borderRadius: '999px',
                    border: '1.5px solid var(--red)',
                    backgroundColor: '#FFFFFF',
                    color: 'var(--red)',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(180, 35, 24, 0.08)',
                    transition: 'all 180ms ease'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>Propose a student club</span>
                </button>
              </Link>
            </div>

            {/* Grid of the 13 Refined Interest Cards */}
            <div
              className="home-grid-stack"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '20px'
              }}
            >
              {clubAreas.map((area) => {
                const isUpvoted = upvotedIds.has(area.id);
                const theme = getClubTheme(area.name);
                const ThemeIcon = theme.icon;

                return (
                  <div
                    key={area.id}
                    className="refined-club-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '24px 22px',
                      position: 'relative'
                    }}
                  >
                    <div>
                      {/* Top Header of Card: Category Badge + Upvote Button */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '7px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: theme.bg,
                            border: `1px solid ${theme.border}`
                          }}
                        >
                          <ThemeIcon size={14} color={theme.color} />
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: theme.color,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase'
                            }}
                          >
                            {theme.label}
                          </span>
                        </div>

                        {/* Interactive Upvote Pill */}
                        <button
                          type="button"
                          onClick={() => handleUpvote(area.id)}
                          aria-label={`Upvote ${area.name}`}
                          aria-pressed={isUpvoted}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            height: '34px',
                            padding: '0 12px',
                            borderRadius: '999px',
                            border: isUpvoted ? '1.5px solid #1E7B4C' : '1.5px solid #CBD5E1',
                            backgroundColor: isUpvoted ? '#1E7B4C' : '#F8FAFC',
                            color: isUpvoted ? '#FFFFFF' : '#18203A',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 180ms ease'
                          }}
                        >
                          <ArrowUp size={15} strokeWidth={2.4} />
                          <span>{area.upvoteCount || 0}</span>
                        </button>
                      </div>

                      {/* Title & Description */}
                      <h4
                        style={{
                          fontSize: '1.2rem',
                          color: 'var(--navy)',
                          margin: '0 0 8px',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700
                        }}
                      >
                        {area.name}
                      </h4>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.935rem', lineHeight: '22px', margin: 0 }}>
                        {area.description}
                      </p>
                    </div>

                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F4F9', paddingTop: '12px' }}>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        {isUpvoted ? '✓ You upvoted this' : 'Click arrow to upvote'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                        Open to all students
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 5. Section: COMING UP */}
      <section
        className="home-section-pad"
        style={{
          background: 'linear-gradient(180deg, #F8FAFD 0%, #EEF2F7 100%)',
          borderBottom: '1px solid rgba(217, 221, 230, 0.8)',
          padding: '92px 24px 88px'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              flexWrap: 'wrap',
              gap: '20px',
              marginBottom: '36px'
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  backgroundColor: '#FBEAE8',
                  border: '1px solid rgba(180, 35, 24, 0.2)',
                  marginBottom: '14px'
                }}
              >
                <Calendar size={14} color="var(--red)" />
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: 'var(--red)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase'
                  }}
                >
                  CALENDAR & COMMUNITY ACTIVITIES
                </span>
              </div>

              <h2
                style={{
                  fontSize: 'clamp(2.1rem, 3.4vw, 2.75rem)',
                  margin: '0 0 10px',
                  color: 'var(--navy)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15
                }}
              >
                Next activities
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: '28px', margin: 0 }}>
                Open to all international students, Erasmus participants, and domestic buddies in Craiova. Free admission.
              </p>
            </div>

            <Link to="/activities" style={{ textDecoration: 'none' }}>
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  height: '46px',
                  padding: '0 20px',
                  borderRadius: '999px',
                  border: '1.5px solid var(--border)',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--navy)',
                  fontFamily: 'inherit',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(24, 32, 58, 0.05)'
                }}
              >
                <Calendar size={16} />
                <span>Full semester calendar</span>
                <ArrowRight size={16} />
              </button>
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div
              style={{
                padding: '48px 32px',
                textAlign: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: '20px',
                border: '1.5px dashed #CBD5E1',
                boxShadow: '0 2px 10px rgba(24, 32, 58, 0.04)',
                color: 'var(--text-muted)'
              }}
            >
              <Calendar size={32} color="#94A3B8" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', color: 'var(--navy)', fontSize: '18px', fontWeight: 700 }}>
                Activities currently being scheduled
              </h4>
              <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
                New semester events, trips, and meetups will appear here shortly. Check the calendar anytime.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {upcoming.map((act) => {
                const d = act.date ? new Date(act.date) : null;
                const monthStr = d ? d.toLocaleString('en-US', { month: 'short' }) : act.targetMonth?.substring(0, 3) || 'Oct';
                const dayStr = d ? d.getDate() : '--';

                return (
                  <div
                    key={act.id}
                    className="refined-activity-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '20px',
                      padding: '24px 28px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '22px', flexWrap: 'wrap' }}>
                      {/* Date Badge */}
                      <div
                        style={{
                          width: '64px',
                          height: '64px',
                          background: 'linear-gradient(135deg, #B42318 0%, #8F1B12 100%)',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                          fontWeight: 800,
                          lineHeight: 1.1,
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(180, 35, 24, 0.25)'
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>
                          {monthStr}
                        </span>
                        <span style={{ fontSize: '1.45rem', marginTop: '2px' }}>{dayStr}</span>
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '3px 8px',
                              borderRadius: '999px',
                              backgroundColor: '#E8F5EE',
                              color: '#17633D',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            <span className="pulse-dot" />
                            Open to every student
                          </span>
                        </div>

                        <h4
                          style={{
                            fontSize: '1.3rem',
                            color: 'var(--navy)',
                            margin: '0 0 6px',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 800
                          }}
                        >
                          {act.title}
                        </h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.925rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={15} color="#64748B" />
                            <span>{act.dateToConfirm ? 'Time to be confirmed' : act.startTime || '18:00'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MapPin size={15} color="#64748B" />
                            <span>{act.venue || 'Main University Building'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link to={`/activities/${act.slug}`} style={{ textDecoration: 'none' }}>
                      <button
                        type="button"
                        style={{
                          height: '44px',
                          padding: '0 20px',
                          borderRadius: '10px',
                          border: '1.5px solid var(--border)',
                          backgroundColor: '#FFFFFF',
                          color: 'var(--navy)',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 160ms ease'
                        }}
                      >
                        <span>Details and itinerary</span>
                        <ArrowRight size={16} />
                      </button>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 6. Section: CAMPUS HUB & INTERNATIONAL RELATIONS DEPARTMENT */}
      <section
        className="home-section-pad"
        style={{
          backgroundColor: '#18203A',
          color: '#FFFFFF',
          padding: '80px 24px 60px',
          position: 'relative'
        }}
      >
        <div style={{ maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
          <div style={{ maxWidth: '720px', marginBottom: '36px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#F2B705',
                letterSpacing: '0.08em',
                textTransform: 'uppercase'
              }}
            >
              CAMPUS HUB & SUPPORT
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 3vw, 2.4rem)',
                color: '#FFFFFF',
                margin: '8px 0 10px',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800
              }}
            >
              International Relations Department
            </h2>
            <p style={{ color: '#E4E9F4', fontSize: '1rem', lineHeight: '26px', margin: 0 }}>
              The central point of contact for Erasmus+, international degree-seeking students, and academic exchange at the University of Craiova.
            </p>
          </div>

          {/* 3 Contact Info Cards with Dark Translucent Styling */}
          <div
            className="home-grid-stack"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '20px',
              marginBottom: '48px'
            }}
          >
            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F2B705' }}>
                <MapPin size={20} />
                <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>Where to Find Us</strong>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#D9DDE6', lineHeight: '22px' }}>
                Main Building of the University of Craiova, Str. A.I. Cuza nr. 13, 2nd Floor, Rooms 440 and 445, 200585 Craiova, Dolj, Romania
              </p>
            </div>

            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F2B705' }}>
                <Clock size={20} />
                <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>Office Hours</strong>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#D9DDE6', lineHeight: '22px' }}>
                {settings.officeHours || 'Monday to Friday: 10:00 – 14:00 (In-person & appointment)'}
              </p>
            </div>

            <div
              style={{
                padding: '24px',
                borderRadius: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#F2B705' }}>
                <Mail size={20} />
                <strong style={{ fontSize: '15px', color: '#FFFFFF' }}>Direct Inquiries</strong>
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#D9DDE6', lineHeight: '22px' }}>
                <a
                  href={`mailto:${settings.officeEmail || 'international@ucv.ro'}`}
                  style={{ color: '#F2B705', textDecoration: 'underline' }}
                >
                  {settings.officeEmail || 'international@ucv.ro'}
                </a>
                <br />
                Official replies within 24 hours on working days.
              </p>
            </div>
          </div>

          {/* Footer Branding Bar */}
          <div
            style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              fontSize: '13px',
              color: '#A0AEC0'
            }}
          >
            <div>
              <strong style={{ color: '#FFFFFF' }}>University of Craiova</strong> • International Student Community
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <a
                href={settings.officialInfoUrl || 'https://www.ucv.ro'}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#E4E9F4', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
              >
                <span>Official university portal</span>
                <ExternalLink size={12} />
              </a>
              <Link to="/staff/login" style={{ color: '#E4E9F4' }}>
                Staff Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
