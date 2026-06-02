/**
 * ============================================================
 *    REKAPIN — Auth Service
 *    src/services/authService.js
 *
 *    Semua pemanggilan API yang berhubungan dengan auth.
 *    File ini yang "tahu" tentang:
 *    - Endpoint mana yang dipanggil
 *    - Field apa yang dikirim
 *    - Bagaimana response disimpan
 *
 *    FIELD MAPPING PENTING:
 *    Frontend pakai "fullName" (lebih ramah user)
 *    Backend expect "username" (sesuai DB schema)
 *    → Mapping dilakukan di sini, bukan di komponen UI.
 * ============================================================
 * @format
 */

import { api, tokenStorage } from "./api";
import { jwtDecode } from "jwt-decode";

// ── REGISTER ──────────────────────────────────────────────────
// POST /auth/register
//
// Menerima data dari Register.jsx (sudah divalidasi frontend),
// mapping field sesuai API contract, lalu kirim ke backend.
//
// Owner  → kirim username, email, password, role, businessName, invitationCode?
// Employee → kirim username, email, password, role (saja)

export async function registerUser({
  role,
  fullName,
  businessName,
  email,
  password,
  invitationCode,
}) {
  // ── Kenapa kita buat payload manual, tidak langsung spread form? ──
  // Karena frontend punya field "confirmPassword" yang TIDAK boleh
  // dikirim ke backend. Dan "fullName" harus diubah jadi "username".

  const payload = {
    username: fullName, // ← mapping: fullName → username
    email,
    password,
    role,
  };

  // Field owner-only: hanya tambahkan jika role owner
  if (role === "owner") {
    payload.businessName = businessName;
    // invitationCode wajib untuk owner
    if (invitationCode?.trim()) {
      payload.invitationCode = invitationCode.trim();
    }
  } else if (role === "employee") {
    // Employee: invitationCode wajib
    if (invitationCode?.trim()) {
      payload.invitationCode = invitationCode.trim();
    }
  }

  // Response 201: { status: "success", data: { username, email, role, userId, businessId } }
  const response = await api.post("/auth/register", payload);
  return response.data;
}

// ── LOGIN ─────────────────────────────────────────────────────
// POST /auth/login
//
// Backend mengembalikan accessToken dan refreshToken.
// Kita simpan keduanya ke localStorage via tokenStorage.
// Fungsi ini mengembalikan data user agar bisa disimpan di context.
export async function loginUser({ email, password }) {
  const payload = { email, password };
  const res = await api.post("/auth/login", payload);

  // 1. Teknik Ekstraksi Bertingkat (Tahan Banting)
  // Jika res sudah merupakan data, kita pakai res. Jika res.data ada, kita pakai itu.
  const data = res.data || res;

  // 2. Jika backend membungkus di dalam { data: { ... } }, kita gali lagi
  const finalData = data.data || data;

  // 3. Destructuring dari data yang sudah pasti bersih
  const { accessToken, refreshToken, user, businesses } = finalData;

  if (!accessToken) {
    throw new Error(
      "Struktur respons API tidak sesuai: accessToken tidak ditemukan",
    );
  }

  tokenStorage.setTokens(accessToken, refreshToken);
  const decoded = jwtDecode(accessToken);

  return {
    success: true, // WAJIB untuk Login.jsx
    userId: decoded.user_id,
    user,
    businesses,
  };
}

// ── LOGOUT ───────────────────────────────────────────────────
// DELETE /auth/logout
//
// Backend butuh:
// - Authorization: Bearer <accessToken>   → otomatis ditambah api.js
// - Body: { refreshToken }                → kita kirim manual
//
// Setelah logout berhasil (atau gagal sekalipun), kita clear
// semua token lokal agar user pasti ter-logout dari sisi frontend.

// ── AMANKAN STRUKTUR PENGIRIMAN TOKEN LOGOUT ──────────────────
export async function logoutUser() {
  try {
    const refreshToken = tokenStorage.getRefresh() || "";

    // Kirim langsung objek bodi sebagai parameter kedua sesuai spesifikasi api.js Anda
    const response = await api.delete("/auth/logout", { refreshToken });

    return response?.data;
  } catch (error) {
    console.error("Logout error di sisi service:", error);
  } finally {
    tokenStorage.clearAll();
    localStorage.removeItem("rekapin_user");
  }
}
// ── GET USER PROFILE ──────────────────────────────────────────
// GET /users/:userId
//
// Dipanggil setelah login untuk mendapatkan data profil user.
// userId didapat dari decode token atau dari response register.

export async function getUserById(userId) {
  // Response: { status: "success", data: { id, username, email } }
  const response = await api.get(`/users/${userId}`);
  return response.data;
}

// ── CHECK AUTH STATUS ─────────────────────────────────────────
// Helper sederhana untuk cek apakah user masih punya session valid.
// Digunakan di AppRoutes untuk ProtectedRoute guard.

export function isSessionActive() {
  return !!tokenStorage.getAccess();
}

// ── UPDATE USER PROFILE ──────────────────────────────────────
// PUT /users/:id

export async function updateUserProfile(userId, payload) {
  const response = await api.put(`/users/${userId}`, {
    username: payload.name,
    email: payload.email,
    role: payload.role,
  });

  return response.data;
}

export async function uploadUserAvatar(userId, file) {
  const formData = new FormData();

  // HARUS "avatar"
  // karena backend pakai upload.single("avatar")
  formData.append("avatar", file);

  const response = await api.patch(`/users/${userId}/avatar`, formData);

  return response.data;
}
