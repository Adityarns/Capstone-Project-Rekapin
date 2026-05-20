/**
 * ============================================================
 *    REKAPIN — Profile & Settings Mock Data
 *    src/data/profileData.js
 * ============================================================
 */

/* ── Logged-in user ── */
export const mockUser = {
  name:         "Andi Wijaya",
  role:         "owner",          // "owner" | "employee"
  businessRole: "Owner at Wijaya Furniture",
  email:        "andi@wijaya.com",
  initials:     "AW",
};

/* ── Business info ── */
export const mockBusiness = {
  name:     "Wijaya Furniture",
  industry: "Home & Furniture",
  phone:    "+62 812-3456-7890",
  address:  "Jl. Sukapura No. 45, Bandung",
};

/* ── Team ── */
export const mockTeam = {
  invitationCode: "REKAPIN-2024",
  members: [
    {
      id:       "m-1",
      name:     "Siti Aminah",
      email:    "siti@wijaya.com",
      role:     "Admin",
      initials: "SA",
    },
    {
      id:       "m-2",
      name:     "Budi Santoso",
      email:    "budi@wijaya.com",
      role:     "Viewer",
      initials: "BS",
    },
  ],
};

/* ── Notification defaults ── */
export const mockNotifications = {
  emailNotifications: true,
  monthlyReports:     false,
  aiInsights:         true,
};

/* ── Industry options (for edit modal) ── */
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