import jwt from "jsonwebtoken";
import crypto from "crypto";
import InvariantError from "../exceptions/invariant-error.js";

const TokenManager = {
  generateAccessToken: (payload) =>
    jwt.sign(payload, process.env.ACCESS_TOKEN_KEY),

  generateRefreshToken: (payload) =>
    jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: "30d" }),

  verify: (token, key) => {
    try {
      return jwt.verify(token, key);
    } catch (error) {
      console.log(error);
      throw new InvariantError("Token tidak valid");
    }
  },

  verifyRefreshToken: (refreshToken) => {
    try {
      return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.log(error);
      throw new InvariantError("Refresh token tidak valid");
    }
  },

  // Mengubah token menjadi "sidik" sebelum disimpan ke DB
  hashToken: (token) => crypto.createHash("sha256").update(token).digest("hex"),
};

export default TokenManager;
