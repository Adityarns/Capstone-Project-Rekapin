/**
 * ============================================================
 * REKAPIN — Carbon Service
 * src/services/carbonService.js
 * ============================================================
 * @format
 */

import { api } from "./api";

export async function getCarbonLogs(businessId) {
  try {
    const res = await api.get(`/carbon/${businessId}/logs`);

    // Auto-deteksi struktur JSON (menangani jika Axios sudah mengupas res.data)
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.logs || [];
  } catch (error) {
    console.error("Gagal mengambil carbon logs:", error);
    return [];
  }
}

export async function getCarbonSummary(businessId) {
  try {
    const res = await api.get(`/carbon/${businessId}/summary`);

    // Auto-deteksi struktur JSON (menangani jika Axios sudah mengupas res.data)
    const jsonBody = res.data !== undefined ? res.data : res;
    return jsonBody?.data || jsonBody || {};
  } catch (error) {
    console.error("Gagal mengambil carbon summary:", error);
    return {};
  }
}
