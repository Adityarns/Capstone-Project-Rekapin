/**
 * ============================================================
 *    REKAPIN — App Routes
 *    src/routes/AppRoutes.jsx
 * ============================================================
 * @format
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import DashboardLayout from "../layouts/DashboardLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Transactions from "../pages/transactions/Transactions";
import Reports from "../pages/reports/Reports";
import CarbonTracking from "../pages/carbon/CarbonTracking";
import ProfileSettings from "../pages/profile/ProfileSettings";
import Team from "../pages/team/Team";

/* ── Loading Screen ── */
function LoadingScreen() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "var(--color-neutral-50)",
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-sans)",
        fontSize: "0.875rem",
      }}
    >
      Memuat sesi...
    </div>
  );
}

/* ── Guards ── */
//function ProtectedRoute({ children }) {
  //const { isAuthenticated, isLoading } = useAuth();
  //if (isLoading) return <LoadingScreen />;
  //if (!isAuthenticated) return <Navigate to="/login" replace />;
  //return children;
//}

function ProtectedRoute({ children }) {
  return children;
}

//function PublicRoute({ children }) {
  //const { isAuthenticated, isLoading } = useAuth();
  //if (isLoading) return null;
  //if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  //return children;
//}

function PublicRoute({ children }) {
  return children;
}

/* ── Route Definitions ── */
export default function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

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
        <Route path="/support" element={<Team />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
