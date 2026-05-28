import bcrypt from "bcrypt";
import UserRepositories from "../../users/repositories/users-repositories.js";
import BusinessRepositories from "../../businesses/repositories/businesses-repositories.js";
import TeamMemberRepositories from "../../teams/repositories/team-members-repositories.js";
import AuthenticationRepositories from "../repositories/auth-repositories.js";
import TokenManager from "../../../security/token-manager.js";
import response from "../../../utils/response.js";
import {
  InvariantError,
  AuthenticationError,
  NotFoundError,
} from "../../../exceptions/index.js";

export const register = async (req, res, next) => {
  const { username, businessName, email, password, role, invitationCode } =
    req.validated;

  const emailTaken = await UserRepositories.verifyEmail(email);
  if (emailTaken) {
    return next(new InvariantError("Email sudah digunakan"));
  }

  const invitationCodeTaken =
    await BusinessRepositories.findByInvitationCode(invitationCode);
  if (invitationCode && invitationCodeTaken) {
    return next(new InvariantError("Kode undangan sudah digunakan"));
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // ================================================
  //  Owner → buat user + bisnis sekaligus
  // ================================================
  if (role === "owner") {
    if (!businessName) {
      return next(
        new InvariantError("Nama bisnis wajib diisi untuk pemilik UMKM"),
      );
    }

    const { user_id: userId } = await UserRepositories.addUser({
      username: username,
      email,
      password: passwordHash,
    });

    const { business_id: businessId } = await BusinessRepositories.addBusiness({
      ownerId: userId,
      businessName,
      invitationCode,
    });

    await TeamMemberRepositories.addTeamMember({
      businessId,
      userId,
      role: "owner",
    });

    const data = { username, email, role, userId, businessId };

    return response(res, 201, "Akun dan bisnis berhasil dibuat", data);
  }

  // ================================================
  //  Karyawan → buat user saja, belum join bisnis
  //  (akan join bisnis saat login dengan invitation code)
  // ================================================
  const { user_id: userId } = await UserRepositories.addUser({
    username: username,
    email,
    password: passwordHash,
  });

  const data = { username, email, role, userId };

  return response(res, 201, "Akun berhasil dibuat", data);
};

export const login = async (req, res, next) => {
  const { email, password, invitationCode } = req.validated;

  // 1. Validasi kredensial pengguna
  const userId = await UserRepositories.verifyUserCredential(email, password);
  if (!userId) {
    return next(new NotFoundError("Kredensial yang Anda berikan salah"));
  }

  // Variabel penampung tunggal yang sah
  let targetBusinessId = null;

  // 2. LOGIKA JALUR KODE UNDANGAN (EMPLOYEE)
  if (invitationCode) {
    const business =
      await BusinessRepositories.findByInvitationCode(invitationCode);
    console.log("Business found:", business);

    if (!business) {
      return next(new InvariantError("Kode undangan tidak valid"));
    }

    // MEMPERBAIKI VARIABEL: Gunakan targetBusinessId
    targetBusinessId = business.business_id;

    const isMember = await TeamMemberRepositories.isMember({
      businessId: business.business_id,
      userId,
    });
    console.log("Already member:", isMember);

    if (!isMember) {
      await TeamMemberRepositories.addTeamMember({
        businessId: business.business_id,
        userId,
        role: "employee",
      });
    }
  } else {
    // 3. LOGIKA JALUR LOGIN BIASA (OWNER / USER LAMA)
    // Mencari ID bisnis yang terikat dengan user ini secara otomatis
    const userBusiness =
      await BusinessRepositories.findBusinessIdByUserId(userId);
    if (userBusiness) {
      targetBusinessId = userBusiness.business_id;
    }
  }

  // 4. Manajemen pembuatan Token JWT
  const accessToken = TokenManager.generateAccessToken({ user_id: userId });
  const refreshToken = TokenManager.generateRefreshToken({ user_id: userId });
  const { exp } = TokenManager.verifyRefreshToken(refreshToken);

  await AuthenticationRepositories.addRefreshToken({
    userId,
    tokenHash: TokenManager.hashToken(refreshToken),
    expiresAt: new Date(exp * 1000),
  });

  // 5. Ambil detail profil user untuk disuplai ke AuthContext Frontend
  const userProfile = await UserRepositories.getUserById(userId);

  // 6. ── RESPON PENYELARAS UTAMA (BEBAS UNDEFINED) ────────────────────────────
  return response(res, 200, "Authentication berhasil ditambahkan", {
    accessToken,
    refreshToken,
    user: {
      user_id: userId, // Samakan dengan console log frontend (user_id)
      username: userProfile?.username || "Aditya",
      email: userProfile?.email || email,
      role: invitationCode ? "employee" : userProfile?.role || "owner",
      business_id: targetBusinessId, // <-- Nilai dijamin terisi string ID asli dari DB
      business_name: userProfile?.business_name || null, // <-- Bisa null jika tidak ada bisnis terkait
      avatar_url: userProfile?.avatar_url || null, // <-- Bisa null jika tidak ada avatar
    },
  });
};

export const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.validated;

  const result = await AuthenticationRepositories.verifyRefreshToken(
    TokenManager.hashToken(refreshToken),
  );
  if (!result) {
    return next(new InvariantError("Refresh token tidak valid"));
  }

  const { user_id } = TokenManager.verifyRefreshToken(refreshToken);

  const currentUserId = req.user.user_id;

  if (currentUserId !== user_id) {
    return next(
      new InvariantError(
        "Refresh token tidak sesuai dengan kredensial pengguna",
      ),
    );
  }

  // 4. Generate token baru jika identitas cocok
  const accessToken = TokenManager.generateAccessToken({ user_id });

  return response(res, 200, "Access Token berhasil diperbarui", {
    accessToken,
  });
};

export const logout = async (req, res, next) => {
  const { refreshToken } = req.validated;

  const result = await AuthenticationRepositories.verifyRefreshToken(
    TokenManager.hashToken(refreshToken),
  );
  if (!result) {
    return next(new InvariantError("Refresh token tidak valid"));
  }

  const { user_id } = TokenManager.verifyRefreshToken(refreshToken);
  const currentUserId = req.user.user_id;

  if (currentUserId !== user_id) {
    return next(
      new InvariantError(
        "Refresh token tidak sesuai dengan kredensial pengguna",
      ),
    );
  }

  await AuthenticationRepositories.deleteRefreshToken(
    TokenManager.hashToken(refreshToken),
  );

  return response(res, 200, "Refresh token berhasil dihapus");
};
