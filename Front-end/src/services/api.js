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

  if (options.body instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  // ── Otomatis tambahkan Bearer token jika tersedia ──
  // Setiap request (kecuali login/register) butuh ini.
  // Backend cek: Authorization: Bearer <accessToken>
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  let data;
  if (options.responseType === "blob") {
    data = await response.blob();
  } else {
    const text = await response.text();
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
  }

  // ── Kenapa tidak hanya cek response.ok? ──────────────────
  // Backend Rekapin selalu mengembalikan JSON bahkan untuk error.
  // Response body punya field "status": "success" atau "fail".
  if (!response.ok) {
    let message = "Terjadi kesalahan pada server.";
    let responsePayload = data;

    // Helper: Extract text dari HTML error page jika ada
    const extractMessageFromHTML = (html) => {
      try {
        // Coba cari message di dalam <pre> tags (error pages biasanya punya ini)
        const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        if (preMatch && preMatch[1]) {
          // Ambil baris pertama dari <pre> content
          const lines = preMatch[1].split("<br");
          let firstLine = lines[0]
            .replace(/<[^>]*>/g, "") // Strip HTML tags
            .replace(/&nbsp;/g, " ") // Replace HTML entities
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim();

          // Jika ada "Error:" prefix yang berulang, ambil saja pesan setelah ": "
          if (firstLine.includes(": ")) {
            firstLine = firstLine.split(": ").pop();
          }
          return firstLine || null;
        }
        return null;
      } catch {
        return null;
      }
    };

    if (options.responseType === "blob") {
      const errorText = await response.text();
      try {
        responsePayload = JSON.parse(errorText);
        message =
          responsePayload?.message ||
          responsePayload?.error ||
          errorText ||
          message;
      } catch {
        message = errorText || message;
      }
    } else if (typeof data === "string" && data.includes("<")) {
      // Data adalah HTML → ekstrak pesan dari HTML
      const extractedMessage = extractMessageFromHTML(data);
      message = extractedMessage || "Terjadi kesalahan pada server.";
      responsePayload = { rawHTML: data }; // Simpan HTML untuk debugging
    } else {
      // Data adalah JSON atau teks biasa
      message =
        data?.message ||
        data?.error ||
        data?.detail ||
        (typeof data === "string" ? data : message);
      responsePayload = data;
    }

    console.error("API Error Response Data:", responsePayload);

    const err = new Error(message);
    err.status = response.status;
    err.response = responsePayload;
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
    apiRequest(url, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  put: (url, body) =>
    apiRequest(url, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  patch: (url, body, opts = {}) =>
    apiRequest(url, {
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...opts,
    }),

  delete: (url, body) =>
    apiRequest(url, {
      method: "DELETE",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
