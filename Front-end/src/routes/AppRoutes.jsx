/** @format */

import { Routes, Route, Navigate } from "react-router-dom";

/* ── Auth Pages ─────────────────────────────────────────────── */
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

/* ── Dashboard Layout (wraps all protected pages) ───────────── */
import DashboardLayout from "../layouts/DashboardLayout";

/* ── Protected Pages ────────────────────────────────────────── */
import Dashboard from "../pages/dashboard/Dashboard";
import Transactions from "../pages/transactions/Transactions";
import Reports from "../pages/reports/Reports";
import CarbonTracking from "../pages/carbon/CarbonTracking";
import ProfileSettings from "../pages/profile/ProfileSettings";

/* ── Auth Guard (simple placeholder) ────────────────────────────
   TODO: Replace isAuthenticated with real Supabase session check.
   Example:
     import { useAuth } from '../hooks/useAuth'
     const { session } = useAuth()
     const isAuthenticated = !!session
──────────────────────────────────────────────────────────────── */
const isAuthenticated = false; // ← swap with real auth state later

/* Redirects to /login if user is not authenticated */
function ProtectedRoute({ children }) {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

/* Redirects to /dashboard if user is already logged in */
function PublicRoute({ children }) {
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/* ── Route Definitions ──────────────────────────────────────── */
export default function AppRoutes() {
  return (
    <Routes>
      {/* ── Root redirect ── */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

      {/* ── Public / Auth Routes ── */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* ── Protected Routes (wrapped in DashboardLayout) ── */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/carbon" element={<CarbonTracking />} />
        <Route path="/profile" element={<ProfileSettings />} />
      </Route>

      {/* ── 404 fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
