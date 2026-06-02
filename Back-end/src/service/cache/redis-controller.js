import CacheService from "../cache/redis-cache.js";
import response from "../../utils/response.js";

// Buat instans-nya di sini
const cacheService = new CacheService();

export const resetAllCache = async (req, res) => {
  // Sekarang panggil pada objek 'cacheService', bukan kelas 'CacheService'
  await cacheService.flushAll();
  return response(res, 200, "Seluruh cache berhasil direset");
};
