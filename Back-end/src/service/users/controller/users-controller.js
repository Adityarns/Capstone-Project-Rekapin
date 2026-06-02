import UserRepositories from "../repositories/users-repositories.js";
import bcrypt from "bcrypt";
import { uploadAvatar, deleteAvatar } from "../../supabase/supabase-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";
import CacheService from "../../cache/redis-cache.js";

const cacheService = new CacheService();

export const addUser = async (req, res, next) => {
  const { username, email, passwordHash } = req.validated;
  const isEmailExist = await UserRepositories.verifyEmail(email);
  if (isEmailExist) {
    return next(
      new InvariantError("Gagal menambahkan akun, email sudah digunakan"),
    );
  }
  const user = await UserRepositories.addUser({
    username,
    email,
    passwordHash,
  });
  if (!user) {
    return next(new InvariantError("Akun gagal ditambahkan"));
  }
  return response(res, 201, "Akun berhasil ditambahkan", user);
};

export const getUserById = async (req, res, next) => {
  const { userId } = req.params;
  const cachedUser = await cacheService.get(`user:${userId}`);
  if (cachedUser) {
    res.setHeader("X-Data-Source", "cache");
    return response(res, 200, "Akun ditemukan (cache)", JSON.parse(cachedUser));
  }
  const user = await UserRepositories.getUserById(userId);
  if (!user) {
    return next(new NotFoundError("Akun tidak ditemukan"));
  }
  await cacheService.set(`user:${userId}`, JSON.stringify(user));
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Akun ditemukan", user);
};

export const editUserById = async (req, res, next) => {
  const { userId } = req.params;
  const isUserExist = await UserRepositories.getUserById(userId);
  if (!isUserExist) {
    return next(new NotFoundError("User tidak ditemukan"));
  }
  const payload = req.validated;
  const user = await UserRepositories.editUserById({ userId, ...payload });
  if (!user) {
    return next(new InvariantError("User gagal diperbarui"));
  }
  await cacheService.del(`user:${userId}`); // Hapus cache lama jika ada
  await cacheService.del(`user:all`);
  return response(res, 201, "User berhasil diperbarui", user);
};

export const updatePassword = async (req, res, next) => {
  const { userId } = req.params;
  const isUserExist = await UserRepositories.getUserById(userId);
  if (!isUserExist) {
    return next(new NotFoundError("User tidak ditemukan"));
  }

  const { currentPassword, newPassword } = req.validated;

  // Ambil hashed password dari database
  const hashedPassword = await UserRepositories.getPasswordByUserId(userId);
  if (!hashedPassword) {
    return next(new InvariantError("Tidak dapat mengambil password pengguna"));
  }

  // Cocokkan password lama dengan input user
  const isMatch = await bcrypt.compare(currentPassword, hashedPassword);
  if (!isMatch) {
    return next(new InvariantError("Password saat ini tidak cocok"));
  }

  const user = await UserRepositories.updatePassword({ userId, newPassword });
  if (!user) {
    return next(new InvariantError("Password gagal diperbarui"));
  }
  await cacheService.del(`user:${userId}`);
  await cacheService.del(`user:all`);
  return response(res, 201, "Password berhasil diperbarui", {
    userId: user.user_id,
  });
};

export const updateAvatar = async (req, res, next) => {
  if (!req.file) {
    return next(new InvariantError("File foto tidak ditemukan"));
  }

  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    return next(
      new InvariantError(
        "Format file tidak didukung. Gunakan JPG, PNG, atau WebP",
      ),
    );
  }

  const maxSizeBytes = 2 * 1024 * 1024; // 2MB
  if (req.file.size > maxSizeBytes) {
    return next(new InvariantError("Ukuran foto maksimal 2MB"));
  }

  const userId = req.user.user_id;

  const oldAvatarUrl = await UserRepositories.getAvatarUrl(userId);
  if (oldAvatarUrl) {
    await deleteAvatar(oldAvatarUrl);
  }

  const avatarUrl = await uploadAvatar({
    userId,
    fileBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
  });

  const updatedUser = await UserRepositories.updateAvatar({
    userId,
    avatarUrl,
  });
  if (!updatedUser) {
    return next(new InvariantError("Gagal memperbarui foto profil"));
  }
  await cacheService.del(`user:${userId}`);
  await cacheService.del(`user:all`);
  return response(res, 200, "Foto profil berhasil diperbarui", {
    avatarUrl: updatedUser.avatar_url,
  });
};
