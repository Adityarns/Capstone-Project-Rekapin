/**
 * ============================================================
 *    REKAPIN — Carbon Service
 *    src/services/carbonService.js
 * ============================================================
 * @format
 */

import { api } from "./api";

export const carbonService = {
  getCarbonSummary: async (businessId) => {
    return await api.get(`/carbon/${businessId}/summary`);
  },
  getCarbonLogs: async (businessId) => {
    return await api.get(`/carbon/${businessId}/logs`);
  },
};
