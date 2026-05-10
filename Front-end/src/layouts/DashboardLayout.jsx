/** @format */

import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <main style={{ flex: 1, padding: "2rem", background: "#faf9f7" }}>
        <Outlet />
      </main>
    </div>
  );
}
