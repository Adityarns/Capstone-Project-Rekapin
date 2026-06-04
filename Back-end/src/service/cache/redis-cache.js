import { Redis } from "@upstash/redis";

class CacheService {
  constructor() {
    // Upstash menggunakan URL dan TOKEN, bukan host dan port
    this._client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  // REST API Upstash tidak memerlukan .connect() atau .isOpen()
  // Karena setiap perintah adalah satu request HTTP independen
  async set(key, value, expirationInSecond = 3600) {
    await this._client.set(key, value, { ex: expirationInSecond });
  }

  async get(key) {
    return await this._client.get(key);
  }

  async del(key) {
    return await this._client.del(key);
  }

  async delPattern(pattern) {
    // Upstash memiliki fitur scan internal, namun cara pemanggilannya sedikit berbeda
    // Catatan: Operasi SCAN di Redis REST seringkali membutuhkan penanganan khusus
    let cursor = 0;
    do {
      const [nextCursor, keys] = await this._client.scan(cursor, {
        match: pattern,
      });
      cursor = nextCursor;
      if (keys.length > 0) {
        await this._client.del(...keys);
      }
    } while (cursor !== 0);
  }

  async flushAll() {
    return await this._client.flushall();
  }
}

export default CacheService;
