/**
 * ============================================================
 *    REKAPIN — Error Handler Utilities
 *    src/utils/errorHandler.js
 *
 *    Utility functions untuk handle, format, dan sanitasi
 *    error messages dari API agar aman ditampilkan di UI.
 * ============================================================
 * @format
 */

/**
 * Sanitasi error message: strip HTML tags, decode entities,
 * dan ambil pesan yang meaningful.
 *
 * Contoh:
 * - "<div>Error: Invalid email</div>" → "Invalid email"
 * - "NotFoundError: Kredensial yang Anda berikan salah" → "Kredensial yang Anda berikan salah"
 * - "User not found" → "User not found" (unchanged)
 */
export function sanitizeErrorMessage(message) {
  if (!message || typeof message !== "string") {
    return "Terjadi kesalahan yang tidak diketahui.";
  }

  let cleaned = message
    .replace(/<[^>]*>/g, "") // Strip semua HTML tags
    .replace(/&nbsp;/g, " ") // HTML entities
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .trim();

  // Jika ada "Error: " atau "NotFoundError: " atau pattern lain, ambil bagian setelahnya
  const errorPatterns = [
    /^[A-Za-z]*Error:\s*/, // "Error: ", "NotFoundError: ", etc
    /^(at|in)\s+/, // Stack traces "at login"
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(cleaned)) {
      cleaned = cleaned.replace(pattern, "").trim();
      break;
    }
  }

  // Jika kosong atau terlalu pendek, kembalikan generic message
  if (!cleaned || cleaned.length < 3) {
    return "Terjadi kesalahan pada server.";
  }

  // Pastikan dimulai dengan huruf kapital
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

/**
 * Format error response object.
 * Gunakan untuk memastikan error yang di-return dari context
 * punya pesan yang sudah di-sanitasi.
 */
export function formatErrorResponse(error) {
  let message = error?.message || error?.toString?.() || "Terjadi kesalahan.";
  return {
    success: false,
    message: sanitizeErrorMessage(message),
  };
}

/**
 * Extract pesan meaningful dari error object
 * (bisa dari backend response, atau thrown error)
 */
export function getErrorMessage(error) {
  if (!error) return "Terjadi kesalahan yang tidak diketahui.";

  // Jika punya .response (dari API layer)
  if (error.response?.message) {
    return sanitizeErrorMessage(error.response.message);
  }

  // Jika punya .message (dari Error object)
  if (error.message) {
    return sanitizeErrorMessage(error.message);
  }

  // Jika punya text representation
  return sanitizeErrorMessage(error.toString());
}
