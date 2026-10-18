import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Bell,
  LogOut,
  X,
  Compass,
  Calendar,
  HelpCircle,
  MessageSquare,
  BookOpen,
  Users,
  Award,
  User,
  MoreHorizontal,
  Globe2
} from 'lucide-react';
import { StitchBand } from '../components/StitchBand.jsx';
import { Logos } from '../components/Logos.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api.js';

export function StudentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const bellRef = useRef(null);

  // Close more sheet on route change
  useEffect(() => {
    setMobileMoreOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  // Poll notifications every 60s
  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      try {
        const data = await api.get('/me/notifications');
        if (isMounted && data) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch {
        // Ignore polling error
      }
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Handle bell open & mark as read
  const handleToggleBell = async () => {
    const nextState = !bellOpen;
    setBellOpen(nextState);

    if (nextState && unreadCount > 0) {
      try {
        await api.post('/me/notifications/read', {});
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch {
        // Ignore mark read error
      }
    }
  };

  // Close bell on click outside or Escape
  useEffect(() => {
    function handleClickOutside(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setBellOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') {
        setBellOpen(false);
        setMobileMoreOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { to: '/student', label: 'Overview', icon: Compass, end: true },
    { to: '/student/events', label: 'My events', icon: Calendar },
    { to: '/student/questions', label: 'Ask the coordinator', icon: HelpCircle },
    { to: '/student/wall', label: 'International Wall', icon: MessageSquare },
    { to: '/student/words', label: 'Learn a word', icon: BookOpen },
    { to: '/student/clubs', label: 'Shape our clubs', icon: Users },
    { to: '/student/ambassadors', label: 'Ambassadors', icon: Award },
    { to: '/student/profile', label: 'My profile', icon: User }
  ];

  // Mobile bottom bar tabs (Overview, Events, Ask, Wall, More)
  const mobileBottomTabs = [
    { to: '/student', label: 'Overview', icon: Compass, end: true },
    { to: '/student/events', label: 'Events', icon: Calendar },
    { to: '/student/questions', label: 'Ask', icon: HelpCircle },
    { to: '/student/wall', label: 'Wall', icon: MessageSquare }
  ];

  // More menu items in bottom sheet
  const moreItems = [
    { to: '/student/words', label: 'Learn a word', icon: BookOpen },
    { to: '/student/clubs', label: 'Shape our clubs', icon: Users },
    { to: '/student/ambassadors', label: 'Ambassadors', icon: Award },
    { to: '/student/profile', label: 'My profile', icon: User },
    { to: '/', label: 'Back to website', icon: Globe2 }
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

      {/* Top Bar */}
      <header
        style={{
          backgroundColor: 'var(--white)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          width: '100%'
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          {/* Left: Logos */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Logos />
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/"
              className="back-to-website-link"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Back to the website
            </Link>

            {/* Notification Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={handleToggleBell}
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} new` : 'Notifications'}
                style={{
                  position: 'relative',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--navy)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '44px',
                  minHeight: '44px'
                }}
              >
                <Bell size={22} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '18px',
                      height: '18px',
                      backgroundColor: 'var(--red)',
                      color: 'var(--white)',
                      borderRadius: '50%',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Desktop Bell dropdown */}
              {bellOpen && (
                <div
                  className="desktop-bell-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: '320px',
                    maxHeight: '400px',
                    backgroundColor: 'var(--white)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    overflowY: 'auto',
                    zIndex: 100,
                    padding: '12px'
                  }}
                >
                  <div
                    style={{
                      paddingBottom: '8px',
                      borderBottom: '1px solid var(--border)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--navy)'
                    }}
                  >
                    Notifications
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: '24px 12px',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.9rem'
                      }}
                    >
                      Nothing new yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {notifications.map((notif) => (
                        <div
                          key={notif.id || notif._id}
                          onClick={() => {
                            setBellOpen(false);
                            if (notif.link) navigate(notif.link);
                          }}
                          style={{
                            padding: '8px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: notif.isRead ? 'transparent' : 'var(--blue-tint)',
                            cursor: 'pointer',
                            fontSize: '0.85rem'
                          }}
                        >
                          <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{notif.title}</div>
                          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>{notif.body}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Avatar & Info */}
            <Link
              to="/student/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none'
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--marigold)',
                  color: 'var(--navy)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {getInitials(user?.fullName)}
              </div>
              <div className="student-card-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy)', lineHeight: 1.2 }}>
                  {user?.fullName || 'Student'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Student</span>
              </div>
            </Link>

            {/* Desktop Log Out */}
            <button
              type="button"
              className="desktop-only"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                minHeight: '38px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--red)',
                backgroundColor: 'transparent',
                color: 'var(--red)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={16} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main container with Sidebar & Content */}
      <div
        style={{
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flex: 1
        }}
      >
        {/* Desktop Sidebar */}
        <aside
          className="student-sidebar"
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
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-pill)',
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    textDecoration: 'none',
                    backgroundColor: isActive ? 'var(--navy)' : 'transparent',
                    color: isActive ? 'var(--white)' : 'var(--navy)',
                    transition: 'all var(--transition-fast)'
                  })}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Bottom desktop log out button */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border)', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1.5px solid var(--red)',
                backgroundColor: 'transparent',
                color: 'var(--red)',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        {/* Content area */}
        <main
          className="student-main-content"
          style={{
            flex: 1,
            padding: '32px 24px',
            minWidth: 0
          }}
        >
          <React.Suspense
            fallback={
              <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ width: 220, height: 36, background: '#EEF0F4', borderRadius: 8 }} />
                <div style={{ width: '100%', height: 200, background: '#FFFFFF', border: '1px solid #D9DDE6', borderRadius: 16 }} />
              </div>
            }
          >
            <Outlet />
          </React.Suspense>
        </main>
      </div>

      {/* M4: Fixed Bottom Tab Bar for Mobile */}
      <nav
        className="student-mobile-bottom-nav"
        aria-label="Student mobile navigation"
        style={{
          display: 'none',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid var(--border)',
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.06)',
          height: '62px',
          alignItems: 'center',
          justifyContent: 'space-around',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {mobileBottomTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              style={({ isActive }) => ({
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                minWidth: '56px',
                height: '100%',
                textDecoration: 'none',
                color: isActive ? 'var(--red)' : 'var(--text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '11px',
                transition: 'color var(--transition-fast)'
              })}
            >
              <Icon size={20} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}

        {/* 5th Tab: "More" trigger */}
        <button
          type="button"
          onClick={() => setMobileMoreOpen(true)}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            minWidth: '56px',
            height: '100%',
            background: 'none',
            border: 'none',
            color: mobileMoreOpen ? 'var(--red)' : 'var(--text-muted)',
            fontWeight: mobileMoreOpen ? 700 : 500,
            fontSize: '11px',
            cursor: 'pointer'
          }}
        >
          <MoreHorizontal size={20} strokeWidth={2.2} />
          <span>More</span>
        </button>
      </nav>

      {/* M4: "More" Mobile Bottom Sheet Modal */}
      {mobileMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More navigation"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(24, 32, 58, 0.65)',
            display: 'flex',
            alignItems: 'flex-end',
            animation: 'fadeIn 200ms ease'
          }}
          onClick={() => setMobileMoreOpen(false)}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>More Pages</span>
              <button
                type="button"
                onClick={() => setMobileMoreOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--navy)',
                  padding: '6px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Links */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMoreOpen(false)}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '15px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      color: isActive ? '#FFFFFF' : 'var(--navy)',
                      backgroundColor: isActive ? 'var(--navy)' : 'transparent'
                    })}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Log out in sheet */}
            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--red)',
                  backgroundColor: 'var(--pink-tint)',
                  color: 'var(--red)',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer'
                }}
              >
                <LogOut size={18} />
                <span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Notification Bottom Sheet */}
      {bellOpen && (
        <div
          className="mobile-bell-sheet"
          role="dialog"
          aria-modal="true"
          aria-label="Notifications"
          style={{
            display: 'none',
            position: 'fixed',
            inset: 0,
            zIndex: 10001,
            backgroundColor: 'rgba(24, 32, 58, 0.65)',
            alignItems: 'flex-end'
          }}
          onClick={() => setBellOpen(false)}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '20px 20px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              maxHeight: '75vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--navy)' }}>Notifications</span>
              <button
                type="button"
                onClick={() => setBellOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--navy)' }}
              >
                <X size={20} />
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '28px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '15px' }}>
                Nothing new yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {notifications.map((notif) => (
                  <div
                    key={notif.id || notif._id}
                    onClick={() => {
                      setBellOpen(false);
                      if (notif.link) navigate(notif.link);
                    }}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      backgroundColor: notif.isRead ? 'transparent' : 'var(--blue-tint)',
                      border: '1px solid var(--border)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '15px' }}>{notif.title}</div>
                    <div style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>{notif.body}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .student-sidebar {
            display: none !important;
          }
          .back-to-website-link {
            display: none !important;
          }
          .student-card-text {
            display: none !important;
          }
          .student-mobile-bottom-nav {
            display: flex !important;
          }
          .student-main-content {
            padding: 16px 12px 88px !important;
            min-width: 0 !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }
          .desktop-bell-dropdown {
            display: none !important;
          }
          .mobile-bell-sheet {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
