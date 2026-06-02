import { createClient } from "redis";

class CacheService {
  constructor() {
    const host =
      process.env.REDIS_HOST || process.env.REDIS_SERVER || "localhost";
    const port = process.env.REDIS_PORT || 6379;

    this._client = createClient({
      socket: { host, port },
    });

    this._client.on("error", (error) =>
      console.error("Redis Client Error:", error),
    );

    // Kita panggil koneksi tanpa menunggu di constructor
    this._client.connect().catch(console.error);
  }

  // Tambahkan pengecekan koneksi sebelum operasi apapun
  async _ensureConnected() {
    if (!this._client.isOpen) {
      await this._client.connect();
    }
  }

  async set(key, value, expirationInSecond = 3600) {
    await this._ensureConnected();
    await this._client.set(key, value, { EX: expirationInSecond });
  }

  async get(key) {
    await this._ensureConnected();
    return await this._client.get(key);
  }

  async del(key) {
    await this._ensureConnected();
    return await this._client.del(key);
  }

  async delPattern(pattern) {
    await this._ensureConnected();
    const keys = [];
    let cursor = "0";

    do {
      const reply = await this._client.scan(cursor, { MATCH: pattern });
      cursor = reply.cursor;
      if (reply.keys && reply.keys.length > 0) {
        keys.push(...reply.keys);
      }
    } while (cursor !== "0");

    if (keys.length > 0) {
      return await this._client.del(keys);
    }
    return 0;
  }

  async flushAll() {
    await this._ensureConnected();
    return await this._client.flushAll();
  }
}

export default CacheService;
