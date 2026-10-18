import React from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout.jsx';
import { AuthLayout } from './layouts/AuthLayout.jsx';
import { StudentLayout } from './layouts/StudentLayout.jsx';
import { StaffLayout } from './layouts/StaffLayout.jsx';
import { useAuth } from './context/AuthContext.jsx';
import { Skeleton } from './components/Skeleton.jsx';

// Pages
import {
  HomePage,
  MapPage,
  ClubsPage,
  ActivitiesPage,
  ActivityDetailPage,
  WallPage,
  WordsPage,
  AmbassadorsPage,
  PrivacyPage
} from './pages/public/PublicPages.jsx';

import { SignUpPage } from './pages/auth/SignUpPage.jsx';
import { SignInPage } from './pages/auth/SignInPage.jsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.jsx';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage.jsx';
import { StaffLoginPage } from './pages/auth/StaffLoginPage.jsx';
import { StaffSetPasswordPage } from './pages/auth/StaffSetPasswordPage.jsx';

// Helper for lazy named exports
function lazyNamed(importFn, name) {
  return React.lazy(() => importFn().then((m) => ({ default: m[name] })));
}

// Student pages (lazy-loaded for fast public load)
const StudentOverviewPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentOverviewPage');
const StudentEventsPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentEventsPage');
const StudentQuestionsPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentQuestionsPage');
const StudentWallPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentWallPage');
const StudentWordsPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentWordsPage');
const StudentClubsPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentClubsPage');
const StudentAmbassadorsPage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentAmbassadorsPage');
const StudentProfilePage = lazyNamed(() => import('./pages/student/StudentPages.jsx'), 'StudentProfilePage');

// Staff pages (lazy-loaded for fast public load)
const StaffDashboardPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffDashboardPage');
const StaffLiveMapPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffLiveMapPage');
const StaffApprovalsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffApprovalsPage');
const StaffStudentsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffStudentsPage');
const StaffImportPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffImportPage');
const StaffQuestionsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffQuestionsPage');
const StaffActivitiesPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffActivitiesPage');
const StaffPlanActivityPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffPlanActivityPage');
const StaffContentPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffContentPage');
const StaffModerationPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffModerationPage');
const StaffClubsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffClubsPage');
const StaffAmbassadorsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffAmbassadorsPage');
const StaffReportsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffReportsPage');
const StaffAccountsPage = lazyNamed(() => import('./pages/staff/StaffPages.jsx'), 'StaffAccountsPage');

import { NotFoundPage } from './pages/public/NotFoundPage.jsx';

// Route Guard for Approved Students
function RequireStudent({ children }) {
  const { user, loading, isApprovedStudent } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton height="36px" width="240px" />
        <Skeleton height="140px" />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!user || !isApprovedStudent) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return children;
}

// Route Guard for Staff & Admin
function RequireStaff({ children, adminOnly = false }) {
  const { user, loading, isStaff, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Skeleton height="36px" width="240px" />
        <Skeleton height="140px" />
        <Skeleton height="200px" />
      </div>
    );
  }

  if (!user || !isStaff) {
    return <Navigate to="/staff/login" state={{ from: location }} replace />;
  }

  if (user.mustChangePassword && location.pathname !== '/staff/set-password') {
    return <Navigate to="/staff/set-password" replace />;
  }

  if (adminOnly && !isAdmin) {
    return (
      <div style={{ padding: '48px 24px', textAlign: 'center' }}>
        <h2>Only admins can open this page.</h2>
      </div>
    );
  }

  return children;
}

export const router = createBrowserRouter([
  // Public layout
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/map', element: <MapPage /> },
      { path: '/clubs', element: <ClubsPage /> },
      { path: '/activities', element: <ActivitiesPage /> },
      { path: '/activities/:slug', element: <ActivityDetailPage /> },
      { path: '/wall', element: <WallPage /> },
      { path: '/words', element: <WordsPage /> },
      { path: '/ambassadors', element: <AmbassadorsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '*', element: <NotFoundPage /> }
    ]
  },

  // Auth layout
  {
    element: <AuthLayout />,
    children: [
      { path: '/signup', element: <SignUpPage /> },
      { path: '/signin', element: <SignInPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
      { path: '/staff/login', element: <StaffLoginPage /> },
      {
        path: '/staff/set-password',
        element: (
          <RequireStaff>
            <StaffSetPasswordPage />
          </RequireStaff>
        )
      }
    ]
  },

  // Student Area
  {
    path: '/student',
    element: (
      <RequireStudent>
        <StudentLayout />
      </RequireStudent>
    ),
    children: [
      { index: true, element: <StudentOverviewPage /> },
      { path: 'events', element: <StudentEventsPage /> },
      { path: 'questions', element: <StudentQuestionsPage /> },
      { path: 'wall', element: <StudentWallPage /> },
      { path: 'words', element: <StudentWordsPage /> },
      { path: 'clubs', element: <StudentClubsPage /> },
      { path: 'ambassadors', element: <StudentAmbassadorsPage /> },
      { path: 'profile', element: <StudentProfilePage /> }
    ]
  },

  // Staff Area
  {
    path: '/staff',
    element: (
      <RequireStaff>
        <StaffLayout />
      </RequireStaff>
    ),
    children: [
      { index: true, element: <StaffDashboardPage /> },
      { path: 'live-map', element: <StaffLiveMapPage /> },
      { path: 'approvals', element: <StaffApprovalsPage /> },
      { path: 'students', element: <StaffStudentsPage /> },
      {
        path: 'students/import',
        element: (
          <RequireStaff adminOnly>
            <StaffImportPage />
          </RequireStaff>
        )
      },
      { path: 'questions', element: <StaffQuestionsPage /> },
      { path: 'activities', element: <StaffActivitiesPage /> },
      { path: 'activities/new', element: <StaffPlanActivityPage /> },
      { path: 'activities/:id/edit', element: <StaffPlanActivityPage /> },
      { path: 'content', element: <StaffContentPage /> },
      { path: 'moderation', element: <StaffModerationPage /> },
      { path: 'clubs', element: <StaffClubsPage /> },
      { path: 'ambassadors', element: <StaffAmbassadorsPage /> },
      { path: 'reports', element: <StaffReportsPage /> },
      {
        path: 'accounts',
        element: (
          <RequireStaff adminOnly>
            <StaffAccountsPage />
          </RequireStaff>
        )
      }
    ]
  }
]);
