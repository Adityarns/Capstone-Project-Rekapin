/**
 * ============================================================
 *    REKAPIN — Base API Client
 *    src/services/api.js
 *
 *    Semua HTTP request ke backend melewati file ini.
 *    Tugas file ini:
 *    1. Menyimpan BASE_URL dari environment variable
 *    2. Otomatis menambahkan Authorization header
 *    3. Handle error response dari backend secara konsisten
 *    4. Handle token refresh saat accessToken expired
 * ============================================================
 * @format
 */

// ── Kenapa import.meta.env dan bukan process.env? ────────────
// Vite menggunakan import.meta.env, bukan Node.js process.env.
// Variabel wajib diawali VITE_ agar di-expose ke browser.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

// ── Token management helpers ──────────────────────────────────
// Kita simpan token di localStorage agar tidak hilang saat refresh halaman.
// Untuk production: pertimbangkan httpOnly cookie (lebih aman dari XSS).
// Untuk capstone: localStorage sudah cukup.

export const tokenStorage = {
  getAccess: () => localStorage.getItem("accessToken"),
  getRefresh: () => localStorage.getItem("refreshToken"),
  setTokens: (a, r) => {
    localStorage.setItem("accessToken", a);
    localStorage.setItem("refreshToken", r);
  },
  setAccess: (a) => localStorage.setItem("accessToken", a),
  clearAll: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },
};

// ── Internal fetch wrapper ────────────────────────────────────
// Fungsi ini yang sebenarnya memanggil fetch().
// Dipisah dari apiRequest() agar bisa dipanggil ulang
// tanpa menyebabkan infinite loop saat refresh token.

async function _fetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
    ...options,
  };

  // ── Otomatis tambahkan Bearer token jika tersedia ──
  // Setiap request (kecuali login/register) butuh ini.
  // Backend cek: Authorization: Bearer <accessToken>
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);
  const data = await response.json();

  // ── Kenapa tidak hanya cek response.ok? ──────────────────
  // Backend Rekapin selalu mengembalikan JSON bahkan untuk error.
  // Response body punya field "status": "success" atau "fail".
  // Kita cek HTTP status code (2xx = ok) untuk throw error.
  if (!response.ok) {
    // Lempar error dengan pesan dari backend agar bisa ditampilkan di UI
    const err = new Error(data?.message || "Terjadi kesalahan pada server.");
    err.status = response.status;
    err.response = data;
    throw err;
  }

  return data;
}

// ── Public API request function ───────────────────────────────
// Ini yang dipakai oleh service layer (authService.js, dll).
// Punya logic auto-refresh: jika dapat 401, coba refresh token,
// lalu ulangi request yang gagal sekali.

export async function apiRequest(endpoint, options = {}) {
  try {
    return await _fetch(endpoint, options);
  } catch (error) {
    // ── Auto-refresh token saat 401 Unauthorized ──────────
    // Artinya: accessToken sudah expired, coba minta yang baru
    // pakai refreshToken yang disimpan.
    if (error.status === 401) {
      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        // Tidak ada refresh token → user harus login ulang
        tokenStorage.clearAll();
        window.location.href = "/login";
        return;
      }

      try {
        // PUT /auth/refresh → dapat accessToken baru
        const refreshData = await _fetch("/auth/refresh", {
          method: "PUT",
          body: JSON.stringify({ refreshToken }),
        });

        // Simpan accessToken baru, lalu ulangi request asli
        tokenStorage.setAccess(refreshData.data.accessToken);
        return await _fetch(endpoint, options);
      } catch {
        // Refresh gagal → session benar-benar expired, paksa logout
        tokenStorage.clearAll();
        window.location.href = "/login";
        return;
      }
    }

    // Error selain 401 → lempar ke caller untuk ditangani di UI
    throw error;
  }
}

// ── Convenience methods ───────────────────────────────────────
// Shorthand agar service layer tidak perlu tulis { method: "POST" } manual.

export const api = {
  get: (url, opts) => apiRequest(url, { method: "GET", ...opts }),
  post: (url, body) =>
    apiRequest(url, { method: "POST", body: JSON.stringify(body) }),
  put: (url, body) =>
    apiRequest(url, { method: "PUT", body: JSON.stringify(body) }),
  delete: (url, body) =>
    apiRequest(url, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
