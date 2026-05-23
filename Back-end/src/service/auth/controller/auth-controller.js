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

  const userId = await UserRepositories.verifyUserCredential(email, password);
  if (!userId) {
    return next(new NotFoundError("Kredensial yang Anda berikan salah"));
  }
  
  if (invitationCode) {
    const business =
      await BusinessRepositories.findByInvitationCode(invitationCode);
    console.log("Business found:", business); // CEK INI

    if (!business) {
      return next(new InvariantError("Kode undangan tidak valid"));
    }

    const isMember = await TeamMemberRepositories.isMember({
      businessId: business.business_id,
      userId,
    });
    console.log("Already member:", isMember); // CEK INI

    if (!isMember) {
      const added = await TeamMemberRepositories.addTeamMember({
        businessId: business.business_id,
        userId,
        role: "employee",
      });
      console.log("Add result:", added); // CEK INI
    }
  }

  const accessToken = TokenManager.generateAccessToken({ user_id: userId });
  const refreshToken = TokenManager.generateRefreshToken({ user_id: userId });
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
