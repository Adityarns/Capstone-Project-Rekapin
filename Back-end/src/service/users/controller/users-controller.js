import UserRepositories from "../repositories/users-repositories.js";
import { uploadAvatar, deleteAvatar } from "../../supabase/supabase-service.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";

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
  const user = await UserRepositories.getUserById(userId);
  if (!user) {
    return next(new NotFoundError("Akun tidak ditemukan"));
  }
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
  return response(res, 201, "User berhasil diperbarui", user);
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

  // Hapus foto lama di Supabase jika ada
  const oldAvatarUrl = await UserRepositories.getAvatarUrl(userId);
  if (oldAvatarUrl) {
    await deleteAvatar(oldAvatarUrl);
  }

  // Upload foto baru ke Supabase
  const avatarUrl = await uploadAvatar({
    userId,
    fileBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
  });

  // Simpan URL baru ke database
  const updatedUser = await UserRepositories.updateAvatar({
    userId,
    avatarUrl,
  });
  if (!updatedUser) {
    return next(new InvariantError("Gagal memperbarui foto profil"));
  }

  return response(res, 200, "Foto profil berhasil diperbarui", {
    avatarUrl: updatedUser.avatar_url,
  });
};
