/**
 * ============================================================
 *    REKAPIN — Profile & Settings Mock Data
 *    src/data/profileData.js
 *
 *    Changelog:
 *    - mockUser: tambah field phone
 *    - mockTeam: role Admin → Owner, Viewer → Employee
 *    - tambah loginSessions (untuk LoginHistoryModal)
 *    - tambah industryOptions
 * ============================================================
 *
 * @format
 */

/* ── Logged-in user ── */
export const mockUser = {
  name: "Andi Wijaya",
  role: "owner", // "owner" | "employee"
  businessRole: "Owner at Wijaya Furniture",
  email: "andi@wijaya.com",
  phone: "+62 812-3456-7890",
  initials: "AW",
  avatarSrc: null, // null = tampilkan initials
};

/* ── Business info ── */
export const mockBusiness = {
  name: "Wijaya Furniture",
  industry: "Home & Furniture",
  phone: "+62 812-3456-7890",
  address: "Jl. Sukapura No. 45, Bandung",
};

/* ── Team — UPDATED: Admin→Owner, Viewer→Employee ── */
export const mockTeam = {
  invitationCode: "REKAPIN-2024",
  members: [
    {
      id: "m-1",
      name: "Siti Aminah",
      email: "siti@wijaya.com",
      role: "Owner", // was: Admin
      initials: "SA",
    },
    {
      id: "m-2",
      name: "Budi Santoso",
      email: "budi@wijaya.com",
      role: "Employee", // was: Viewer
      initials: "BS",
    },
  ],
};

/* ── Notification defaults ── */
export const mockNotifications = {
  emailNotifications: true,
  monthlyReports: false,
  aiInsights: true,
};

/* ── Login sessions (for LoginHistoryModal) ── */
export const loginSessions = [
  {
    id: "s-1",
    device: "Chrome on Windows",
    location: "Bandung, ID",
    lastActive: "2 minutes ago",
    isCurrent: true,
  },
  {
    id: "s-2",
    device: "Android App",
    location: "Jakarta, ID",
    lastActive: "Yesterday, 14:32",
    isCurrent: false,
  },
  {
    id: "s-3",
    device: "Safari on iPhone",
    location: "Bandung, ID",
    lastActive: "3 days ago",
    isCurrent: false,
  },
];

/* ── Industry options (for EditBusinessModal) ── */
export const industryOptions = [
  "Home & Furniture",
  "Food & Beverage",
  "Fashion & Apparel",
  "Electronics",
  "Health & Beauty",
  "Education",
  "Retail",
  "Services",
  "Other",
];
