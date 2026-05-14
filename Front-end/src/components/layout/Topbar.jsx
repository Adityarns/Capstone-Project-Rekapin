/** @format */
/**
 * ============================================================
 *    REKAPIN — Topbar Component
 *    src/components/layout/Topbar.jsx
 *
 *    Fitur:
 *    - Search bar dengan icon
 *    - Notifikasi bell + badge
 *    - Help button
 *    - User avatar (initials fallback)
 * ============================================================
 * @format
 */

import { useState } from "react";
import "./Topbar.css";

/* ── Icons ───────────────────────────────────────────────────── */

const IconSearch = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const IconBell = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const IconHelp = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

/* ── Component ───────────────────────────────────────────────── */

export default function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO: ambil dari Supabase user session
  const user = {
    name: "Aditya Rahman",
    initials: "AR",
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // TODO: implement global search
    console.log("Search:", searchQuery);
  };

  return (
    <div className="topbar">
      {/* ── Search Bar ── */}
      <form
        className="topbar-search"
        onSubmit={handleSearch}
        role="search"
        aria-label="Search"
      >
        <span className="topbar-search-icon" aria-hidden="true">
          <IconSearch />
        </span>
        <input
          type="search"
          className="topbar-search-input"
          placeholder="Search transactions, reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="Search transactions and reports"
        />
      </form>

      {/* ── Right Actions ── */}
      <div className="topbar-actions">
        {/* Notification Bell */}
        <button
          className="topbar-icon-btn"
          type="button"
          aria-label="Notifications"
        >
          <IconBell />
          {/* Badge — hilangkan jika tidak ada notif */}
          <span className="topbar-notif-badge" aria-hidden="true" />
        </button>

        {/* Help */}
        <button className="topbar-icon-btn" type="button" aria-label="Help">
          <IconHelp />
        </button>

        {/* User Avatar */}
        <button
          className="topbar-avatar"
          type="button"
          aria-label={`User: ${user.name}`}
          title={user.name}
        >
          {/* TODO: ganti dengan <img> saat user.avatarUrl tersedia */}
          <span className="topbar-avatar-initials">{user.initials}</span>
        </button>
      </div>
    </div>
  );
}
