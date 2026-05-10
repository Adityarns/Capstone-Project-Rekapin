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
} from "../../../exceptions/index.js";

export const register = async (req, res, next) => {
  const { fullName, businessName, email, password, invitationCode } =
    req.validated;

  // Cek apakah email sudah dipakai
  const emailTaken = await UserRepositories.isEmailTaken(email);
  if (emailTaken) {
    return next(new InvariantError("Email sudah digunakan"));
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // ================================================
  //  Invitation Code kosong → Owner baru
  // ================================================
  if (!invitationCode) {
    if (!businessName) {
      return next(
        new InvariantError("Nama bisnis wajib diisi untuk pemilik UMKM"),
      );
    }

    const { id: userId } = await UserRepositories.addUser({
      fullName,
      email,
      passwordHash,
    });

    const { id: businessId, invitation_code } =
      await BusinessRepositories.addBusiness({
        ownerId: userId,
        businessName,
      });

    await TeamMemberRepositories.addTeamMember({
      businessId,
      userId,
      role: "owner",
    });

    const accessToken = TokenManager.generateAccessToken({ id: userId });
    const refreshToken = TokenManager.generateRefreshToken({ id: userId });
    const { exp } = TokenManager.verifyRefreshToken(refreshToken);

    await AuthenticationRepositories.addRefreshToken({
      userId,
      tokenHash: TokenManager.hashToken(refreshToken),
      expiresAt: new Date(exp * 1000),
    });

    return response(res, 201, "Akun dan bisnis berhasil dibuat", {
      accessToken,
      refreshToken,
      invitationCode: invitation_code, // kembalikan ke owner agar bisa dibagikan
    });
  }

  // ================================================
  // Invitation Code diisi → Admin
  // ================================================
  const business =
    await BusinessRepositories.findByInvitationCode(invitationCode);
  if (!business) {
    return next(new InvariantError("Kode undangan tidak valid"));
  }

  const { id: userId } = await UserRepositories.addUser({
    fullName,
    email,
    passwordHash,
  });

  // User yang bergabung via invitation code default role-nya Admin
  await TeamMemberRepositories.addTeamMember({
    businessId: business.id,
    userId,
    role: "Admin",
  });

  const accessToken = TokenManager.generateAccessToken({ id: userId });
  const refreshToken = TokenManager.generateRefreshToken({ id: userId });
  const { exp } = TokenManager.verifyRefreshToken(refreshToken);

  await AuthenticationRepositories.addRefreshToken({
    userId,
    tokenHash: TokenManager.hashToken(refreshToken),
    expiresAt: new Date(exp * 1000),
  });

  return response(res, 201, "Akun berhasil dibuat dan bergabung ke tim", {
    accessToken,
    refreshToken,
  });
};

export const login = async (req, res, next) => {
  const { email, password } = req.validated;

  const userId = await UserRepositories.verifyUserCredential(email, password);
  if (!userId) {
    return next(new AuthenticationError("Kredensial yang Anda berikan salah"));
  }

  const accessToken = TokenManager.generateAccessToken({ id: userId });
  const refreshToken = TokenManager.generateRefreshToken({ id: userId });

  const { exp } = TokenManager.verifyRefreshToken(refreshToken);

  await AuthenticationRepositories.addRefreshToken({
    userId,
    tokenHash: TokenManager.hashToken(refreshToken),
    expiresAt: new Date(exp * 1000),
  });

  return response(res, 200, "Authentication berhasil ditambahkan", {
    accessToken,
    refreshToken,
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

  const { id } = TokenManager.verifyRefreshToken(refreshToken);
  const accessToken = TokenManager.generateAccessToken({ id });

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

  await AuthenticationRepositories.deleteRefreshToken(
    TokenManager.hashToken(refreshToken),
  );

  return response(res, 200, "Refresh token berhasil dihapus");
};
