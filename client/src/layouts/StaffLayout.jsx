import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  UserCheck,
  GraduationCap,
  HelpCircle,
  Calendar,
  FileText,
  ShieldAlert,
  Users,
  Award,
  BarChart3,
  UserCog,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { StitchBand } from '../components/StitchBand.jsx';
import { Logos } from '../components/Logos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export function StaffLayout() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState({ pendingApprovals: 0, openQuestions: 0 });

  // Badges poll every 30s
  useEffect(() => {
    let isMounted = true;
    async function fetchBadges() {
      try {
        const data = await api.get('/staff/badges');
        if (isMounted && data) {
          setBadges({
            pendingApprovals: data.pendingApprovals || 0,
            openQuestions: data.openQuestions ?? data.unansweredQuestions ?? 0
          });
        }
      } catch {
        // Ignore polling error
      }
    }

    fetchBadges();
    const interval = setInterval(fetchBadges, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  const navItems = [
    { to: '/staff', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/staff/live-map', label: 'Live map', icon: MapPin },
    {
      to: '/staff/approvals',
      label: 'Approvals',
      icon: UserCheck,
      badge: badges.pendingApprovals > 0 ? badges.pendingApprovals : null,
      badgeType: 'marigold'
    },
    { to: '/staff/students', label: 'Students', icon: GraduationCap },
    {
      to: '/staff/questions',
      label: 'Questions',
      icon: HelpCircle,
      badge: badges.openQuestions > 0 ? badges.openQuestions : null,
      badgeType: 'red'
    },
    { to: '/staff/activities', label: 'Activities', icon: Calendar },
    { to: '/staff/content', label: 'Website content', icon: FileText },
    { to: '/staff/moderation', label: 'International Wall', icon: ShieldAlert },
    { to: '/staff/clubs', label: 'Clubs', icon: Users },
    { to: '/staff/ambassadors', label: 'Ambassadors', icon: Award },
    { to: '/staff/reports', label: 'Reports', icon: BarChart3 },
    ...(isAdmin
      ? [{ to: '/staff/accounts', label: 'Staff accounts', icon: UserCog, tag: 'Admin' }]
      : [])
  ];

  const getInitials = (name) => {
    if (!name) return 'ST';
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--paper)' }}>
      <StitchBand />

      {/* Mobile top header */}
      <div
        className="staff-mobile-header"
        style={{
          display: 'none',
          backgroundColor: 'var(--white)',
          padding: '12px 20px',
          borderBottom: '1px solid var(--border)',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Logos subtitle="Staff area" />
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle staff menu"
          style={{
            minHeight: '40px',
            minWidth: '40px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 998,
            backgroundColor: 'rgba(24, 32, 58, 0.6)',
            animation: 'fadeIn 150ms ease'
          }}
        />
      )}

      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Left Sidebar / Slide-in Mobile Drawer */}
        <aside
          className={`staff-sidebar ${mobileMenuOpen ? 'open' : ''}`}
          style={{
            width: '260px',
            backgroundColor: 'var(--white)',
            borderRight: '1px solid var(--border)',
            padding: '24px 16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div>
            {/* Logos with 'Staff area' in red + Mobile Close Button */}
            <div style={{ marginBottom: '20px', paddingLeft: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Logos subtitle="Staff area" />
              <button
                type="button"
                className="mobile-only"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--navy)',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Menu Items */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-pill)',
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      backgroundColor: isActive ? 'var(--navy)' : 'transparent',
                      color: isActive ? 'var(--white)' : 'var(--navy)',
                      transition: 'all var(--transition-fast)'
                    })}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {item.tag && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: '#E9ECEF',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {item.tag}
                        </span>
                      )}
                      {item.badge && (
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '1px 8px',
                            borderRadius: 'var(--radius-pill)',
                            backgroundColor:
                              item.badgeType === 'marigold' ? 'var(--marigold)' : 'var(--pink-tint)',
                            color:
                              item.badgeType === 'marigold' ? 'var(--navy)' : 'var(--red)'
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom user profile & Log out */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid var(--border)', marginTop: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', paddingLeft: '8px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--marigold)',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {getInitials(user?.fullName)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)' }}>
                  {user?.fullName || 'Staff Member'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {user?.role === 'admin' ? 'Admin' : 'Staff'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--red)',
                backgroundColor: 'transparent',
                color: 'var(--red)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main
          className="staff-main-content"
          style={{
            flex: 1,
            padding: '32px 32px',
            minWidth: 0,
            overflowY: 'auto'
          }}
        >
          <React.Suspense
            fallback={
              <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 220, height: 36, background: '#EEF0F4', borderRadius: 8 }} />
                <div style={{ width: '100%', height: 260, background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 16 }} />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .staff-mobile-header {
            display: flex !important;
            padding: 10px 16px !important;
          }
          .staff-sidebar {
            display: none !important;
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            width: 280px !important;
            max-width: 85vw !important;
            z-index: 1000 !important;
            box-shadow: 0 8px 32px rgba(24, 32, 58, 0.25) !important;
            overflow-y: auto !important;
          }
          .staff-sidebar.open {
            display: flex !important;
          }
          .staff-main-content {
            padding: 16px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
