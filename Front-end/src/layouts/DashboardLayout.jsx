/**
 * ============================================================
 *    REKAPIN — Dashboard Layout
 *    src/layouts/DashboardLayout.jsx
 *
 *    CSS Grid shell: Sidebar (fixed) + Topbar + scrollable main.
 *    Semua protected pages di-render via <Outlet />.
 * ============================================================
 * @format
 */

import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";
import "./DashboardLayout.css";

export default function DashboardLayout() {
  return (
    <div className="dash-layout">
      {/* Sidebar — fixed, full height, tidak pernah scroll */}
      <aside className="dash-sidebar">
        <Sidebar />
      </aside>

      {/* Topbar — fixed di atas area konten */}
      <header className="dash-topbar">
        <Topbar />
      </header>

      {/* Main Content — satu-satunya area yang scroll */}
      <main className="dash-main">
        <div className="dash-main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
