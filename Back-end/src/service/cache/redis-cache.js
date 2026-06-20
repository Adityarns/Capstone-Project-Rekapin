import { createClient } from "redis";

class CacheService {
  constructor() {
    // Inisialisasi client standar Node-Redis untuk lokal VPS
    this._client = createClient({
      url: process.env.REDIS_URL, // redis://:password@127.0.0.1:6379
    });

    this._client.on("error", (err) => console.error("Redis Client Error", err));

    // Melakukan koneksi ke server Redis secara asinkronus
    this._connect();
  }

  async _connect() {
    if (!this._client.isOpen) {
      await this._client.connect();
    }
  }

  async set(key, value, expirationInSecond = 3600) {
    await this._connect();

    // Redis native hanya menerima string/buffer.
    // Jika value berupa object/array, kita ubah ke string JSON.
    let rawValue = typeof value === "object" ? JSON.stringify(value) : value;

    await this._client.set(key, rawValue, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    await this._connect();
    const result = await this._client.get(key);

    if (!result) return null;

    // Meniru perilaku Upstash: Jika data berupa JSON string, otomatis di-parse kembali menjadi objek
    try {
      return JSON.parse(result);
    } catch (error) {
      return result; // Kembalikan teks asli jika bukan string JSON
    }
  }

  async del(key) {
    await this._connect();
    return await this._client.del(key);
  }

  async delPattern(pattern) {
    await this._connect();

    // Menggunakan fitur async iterator SCAN milik Node-Redis standar yang jauh lebih bersih
    let keys = [];
    for await (const key of this._client.scanIterator({ MATCH: pattern })) {
      keys.push(key);
    }

    if (keys.length > 0) {
      await this._client.del(keys);
    }
  }

  async flushAll() {
    await this._connect();
    // Pada library standar, perintahnya adalah flushAll (camelCase)
    return await this._client.flushAll();
  }
}

export default CacheService;
