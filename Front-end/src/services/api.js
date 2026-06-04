/**
 * ============================================================
 * REKAPIN — Base API Client
 * src/services/api.js
 *
 * Semua HTTP request ke backend melewati file ini.
 * Tugas file ini:
 * 1. Menyimpan BASE_URL dari environment variable
 * 2. Otomatis menambahkan Authorization header
 * 3. Handle error response dari backend secara konsisten
 * 4. Handle token refresh saat accessToken expired
 * ============================================================
 * @format
 */

// Vite menggunakan import.meta.env, bukan Node.js process.env.
// Variabel wajib diawali VITE_ agar di-expose ke browser.

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
// ── Token management helpers ──────────────────────────────────
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

  // Otomatis tambahkan Bearer token jika tersedia
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, config);

  // ── 1. JIKA RESPONS GAGAL (!response.ok) ──
  // Periksa status terlebih dahulu sebelum mengambil data biner/teks
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = errorText ? JSON.parse(errorText) : null;
    } catch {
      errorData = errorText;
    }

    let message = "Terjadi kesalahan pada server.";

    // PERBAIKAN: Deklarasi tanpa inisialisasi awal untuk menghindari no-useless-assignment
    let responsePayload;

    // Helper: Extract text dari HTML error page jika ada
    const extractMessageFromHTML = (html) => {
      try {
        const preMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/);
        if (preMatch && preMatch[1]) {
          const lines = preMatch[1].split("<br");
          let firstLine = lines[0]
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .trim();

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

    if (typeof errorData === "string" && errorData.includes("<")) {
      const extractedMessage = extractMessageFromHTML(errorData);
      message = extractedMessage || "Terjadi kesalahan pada server.";
      responsePayload = { rawHTML: errorData };
    } else {
      message =
        errorData?.message ||
        errorData?.error ||
        errorData?.detail ||
        (typeof errorData === "string" ? errorData : message);
      responsePayload = errorData;
    }

    console.error("API Error Response Data:", responsePayload);

    const err = new Error(message);
    err.status = response.status;
    err.response = responsePayload;
    throw err;
  }

  // ── 2. JIKA RESPONS SUKSES ──
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

  return data;
}

// ── Public API request function ───────────────────────────────
export async function apiRequest(endpoint, options = {}) {
  try {
    return await _fetch(endpoint, options);
  } catch (error) {
    // Auto-refresh token saat 401 Unauthorized
    if (error.status === 401) {
      const refreshToken = tokenStorage.getRefresh();

      if (!refreshToken) {
        tokenStorage.clearAll();
        window.location.href = "/login";
        return;
      }

      try {
        const refreshData = await _fetch("/auth/refresh", {
          method: "PUT",
          body: JSON.stringify({ refreshToken }),
        });

        tokenStorage.setAccess(refreshData.data.accessToken);
        return await _fetch(endpoint, options);
      } catch {
        tokenStorage.clearAll();
        window.location.href = "/login";
        return;
      }
    }

    throw error;
  }
}

// ── Convenience methods ───────────────────────────────────────
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
