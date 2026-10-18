import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { Logos } from './Logos.jsx';
import { StitchBand } from './StitchBand.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export function PublicHeader({ transparentHero = false }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, isStudent, isStaff } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close dropdown on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/map', label: "Where we're from" },
    { to: '/clubs', label: 'Clubs' },
    { to: '/activities', label: 'Calendar' },
    { to: '/wall', label: 'Wall' },
    { to: '/words', label: 'Learn a word' },
    { to: '/ambassadors', label: 'Ambassadors' }
  ];

  const handleStudentLoginClick = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (isStudent && user?.status === 'approved') {
      navigate('/student');
    } else {
      navigate('/signin');
    }
  };

  const handleStaffLoginClick = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (isStaff) {
      navigate('/staff');
    } else {
      navigate('/staff/login');
    }
  };

  return (
    <>
      <header
        style={{
          backgroundColor: transparentHero ? 'transparent' : 'var(--white)',
          borderBottom: transparentHero ? 'none' : '1px solid var(--border)',
          position: transparentHero ? 'absolute' : 'relative',
          top: transparentHero ? '28px' : 0,
          left: 0,
          right: 0,
          zIndex: 50,
          width: '100%'
        }}
      >
        <div
          className="public-header-inner"
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            height: transparentHero ? '84px' : 'auto',
            padding: transparentHero ? '0 56px' : '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: transparentHero ? '24px' : '16px'
          }}
        >
          {/* Left: Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Logos isHero={transparentHero} />
          </div>

          {/* Center: Desktop Navigation */}
          <nav
            className="desktop-nav"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: transparentHero ? '2px' : '4px'
            }}
          >
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                style={({ isActive }) => {
                  if (transparentHero) {
                    return {
                      position: 'relative',
                      display: 'inline-flex',
                      alignItems: 'center',
                      height: '44px',
                      padding: '0 12px',
                      fontSize: '15px',
                      textDecoration: 'none',
                      color: isActive ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.88)',
                      fontWeight: isActive ? 700 : 400,
                      backgroundColor: 'transparent'
                    };
                  }
                  return {
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: '44px',
                    padding: '0 14px',
                    borderRadius: '10px',
                    fontSize: '15px',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#18203A' : '#2E3650',
                    backgroundColor: isActive ? '#E4E9F4' : 'transparent',
                    transition: 'background-color var(--transition-fast)',
                    textDecoration: 'none'
                  };
                }}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {transparentHero && isActive && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: '12px',
                          right: '12px',
                          bottom: '4px',
                          height: '3px',
                          borderRadius: '2px',
                          backgroundColor: 'rgb(242, 183, 5)'
                        }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right: Desktop Dropdown OR Mobile Join + Hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Desktop Join dropdown */}
            <div className="desktop-join-container" ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  minHeight: '44px',
                  padding: '10px 18px',
                  backgroundColor: 'var(--red)',
                  color: 'var(--white)',
                  fontWeight: 700,
                  fontSize: '15px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
                }}
              >
                <span>Join the community</span>
                <ChevronDown
                  size={16}
                  strokeWidth={2.4}
                  style={{
                    transform: dropdownOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform var(--transition-fast)'
                  }}
                />
              </button>

              {/* Exactly two items dropdown */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '280px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    boxShadow: '0 18px 44px rgba(0, 0, 0, 0.3)',
                    border: '1px solid #E4E9F4',
                    padding: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    zIndex: 100
                  }}
                >
                  <button
                    type="button"
                    onClick={handleStudentLoginClick}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#FBEAE8',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#18203A', fontSize: '16px' }}>
                      Student login
                    </span>
                    <span style={{ fontSize: '13px', color: '#4A536B', marginTop: '2px' }}>
                      Sign in or sign up
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleStaffLoginClick}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      backgroundColor: '#F2F3F6',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%'
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#18203A', fontSize: '16px' }}>
                      Staff login
                    </span>
                    <span style={{ fontSize: '13px', color: '#4A536B', marginTop: '2px' }}>
                      International Relations team
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile "Join" button */}
            <button
              type="button"
              className="mobile-join-btn"
              onClick={() => navigate('/signup')}
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                height: '40px',
                padding: '0 18px',
                backgroundColor: 'var(--red)',
                color: 'var(--white)',
                fontWeight: 700,
                fontSize: '15px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Join
            </button>

            {/* Mobile hamburger button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '42px',
                height: '42px',
                backgroundColor: transparentHero ? 'rgba(255, 255, 255, 0.9)' : 'var(--white)',
                border: '1.5px solid var(--border)',
                borderRadius: '10px',
                color: 'var(--navy)',
                cursor: 'pointer'
              }}
            >
              <Menu size={22} strokeWidth={2.4} />
            </button>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .desktop-nav {
              display: none !important;
            }
            .desktop-join-container {
              display: none !important;
            }
            .mobile-join-btn {
              display: inline-flex !important;
            }
            .mobile-menu-btn {
              display: inline-flex !important;
            }
            .public-header-inner {
              padding: 10px 16px !important;
              height: auto !important;
            }
          }
        `}</style>
      </header>

      {/* M2: Full-screen Navy Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'var(--navy)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Top Romanian Stitch Band */}
          <StitchBand />

          {/* White Header Bar matching M2 */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <div onClick={() => setMobileMenuOpen(false)}>
              <Logos linkToHome={true} />
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                backgroundColor: '#FFFFFF',
                color: 'var(--navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={22} strokeWidth={2.4} />
            </button>
          </div>

          {/* Menu Body */}
          <div
            style={{
              flex: 1,
              padding: '20px 20px 28px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflowY: 'auto'
            }}
          >
            {/* Links */}
            <nav style={{ display: 'flex', flexDirection: 'column' }}>
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileMenuOpen(false)}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 0',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                    fontSize: '20px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    color: isActive ? 'var(--marigold)' : '#FFFFFF'
                  })}
                >
                  <span>{link.label}</span>
                  <ArrowRight size={20} strokeWidth={2.4} />
                </NavLink>
              ))}
            </nav>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px' }}>
              <button
                type="button"
                onClick={handleStudentLoginClick}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: 'var(--red)',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '17px' }}>
                  Student login
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.82)' }}>
                  Sign in or sign up
                </span>
              </button>

              <button
                type="button"
                onClick={handleStaffLoginClick}
                style={{
                  width: '100%',
                  padding: '16px 18px',
                  borderRadius: '14px',
                  backgroundColor: '#232B45',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px'
                }}
              >
                <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: '17px' }}>
                  Staff login
                </span>
                <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)' }}>
                  International Relations team
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
