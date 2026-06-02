import bcrypt from "bcrypt";
import UserRepositories from "../../users/repositories/users-repositories.js";
import BusinessRepositories from "../../businesses/repositories/businesses-repositories.js";
import TeamMemberRepositories from "../../teams/repositories/team-members-repositories.js";
import AuthenticationRepositories from "../repositories/auth-repositories.js";
import TokenManager from "../../../security/token-manager.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";

export const register = async (req, res, next) => {
  try {
    const { username, businessName, email, password, role, invitationCode } =
      req.validated;

    const emailTaken = await UserRepositories.verifyEmail(email);
    if (emailTaken) {
      return next(new InvariantError("Email sudah digunakan"));
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // ================================================
    //  Owner → buat user + bisnis sekaligus (dengan invitation code dari user)
    // ================================================
    if (role === "owner") {
      if (!businessName) {
        return next(
          new InvariantError("Nama bisnis wajib diisi untuk pemilik UMKM"),
        );
      }

      if (!invitationCode) {
        return next(
          new InvariantError("Kode undangan wajib diisi untuk membuat bisnis"),
        );
      }

      // CEK DULU: apakah invitation code sudah digunakan oleh bisnis lain?
      // SEBELUM membuat user
      const isInvitationCodeExist =
        await BusinessRepositories.findByInvitationCode(invitationCode);
      if (isInvitationCodeExist) {
        return next(new InvariantError("Kode undangan sudah digunakan."));
      }

      // Baru buat user SETELAH semua validasi berhasil
      const { user_id: userId } = await UserRepositories.addUser({
        username: username,
        email,
        password: passwordHash,
      });

      // Owner membuat bisnis dengan invitation code yang dia berikan
      const { business_id: businessId } =
        await BusinessRepositories.addBusiness({
          ownerId: userId,
          businessName,
          invitationCode,
        });

      await TeamMemberRepositories.addTeamMember({
        businessId,
        userId,
        role: "owner",
      });

      const data = {
        username,
        email,
        role,
        userId,
        businessId,
        invitationCode, // Return kode yang diberikan user
      };

      return response(res, 201, "Akun dan bisnis berhasil dibuat", data);
    } else {
      // EMPLOYEE: Validasi invitation code DULU, SEBELUM membuat user
      if (!invitationCode) {
        return next(
          new InvariantError("Kode undangan wajib diisi untuk bergabung"),
        );
      }

      const targetBusiness =
        await BusinessRepositories.findByInvitationCode(invitationCode);
      if (!targetBusiness) {
        return next(
          new InvariantError(
            "Kode undangan tidak valid atau sudah tidak aktif",
          ),
        );
      }

      // Baru buat user SETELAH semua validasi berhasil
      const { user_id: userId } = await UserRepositories.addUser({
        username: username,
        email,
        password: passwordHash,
      });

      await TeamMemberRepositories.addTeamMember({
        businessId: targetBusiness.business_id,
        userId,
        role: "employee",
      });

      const data = { username, email, role, userId };
      return response(res, 201, "Akun berhasil dibuat", data);
    }
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  const { email, password } = req.validated;

  // 1. Validasi kredensial pengguna
  const userId = await UserRepositories.verifyUserCredential(email, password);
  if (!userId) {
    return next(new NotFoundError("Kredensial yang Anda berikan salah"));
  }

  const accessibleBusinesses =
    await BusinessRepositories.getAccessibleBusinesses(userId);

  // 3. Manajemen pembuatan Token JWT
  const accessToken = TokenManager.generateAccessToken({ user_id: userId });
  const refreshToken = TokenManager.generateRefreshToken({ user_id: userId });
  const { exp } = TokenManager.verifyRefreshToken(refreshToken);

  await AuthenticationRepositories.addRefreshToken({
    userId,
    tokenHash: TokenManager.hashToken(refreshToken),
    expiresAt: new Date(exp * 1000),
  });

  const userProfile = await UserRepositories.getUserById(userId);

  return response(res, 200, "Authentication berhasil", {
    accessToken,
    refreshToken,
    user: {
      user_id: userId,
      username: userProfile?.username || "Pengguna",
      email: userProfile?.email || email,
      avatar_url: userProfile?.avatar_url || null,
      business_id: userProfile?.business_id || null, // Tambahkan ini!
      business_name: userProfile?.business_name || null, // Tambahkan ini!
    },
    businesses: accessibleBusinesses,
  });
};

// ================================================
// ENDPOINT BARU: GABUNG WORKSPACE DARI DASHBOARD SELECTION
// ================================================
export const joinBusinessWorkspace = async (req, res, next) => {
  try {
    const { invitationCode } = req.body;
    const userId = req.user.user_id; // Diambil dari middleware auth

    if (!invitationCode) {
      return next(new InvariantError("Kode undangan wajib diisi"));
    }

    const business =
      await BusinessRepositories.findByInvitationCode(invitationCode);
    if (!business) {
      return next(new NotFoundError("Bisnis tidak ditemukan atau kode salah"));
    }

    const isMember = await TeamMemberRepositories.isMember({
      businessId: business.business_id,
      userId,
    });

    if (isMember) {
      return next(
        new InvariantError("Anda sudah tergabung dalam workspace ini"),
      );
    }

    await TeamMemberRepositories.addTeamMember({
      businessId: business.business_id,
      userId,
      role: "employee",
    });

    return response(res, 200, "Berhasil bergabung ke workspace", {
      business_id: business.business_id,
      business_name: business.business_name,
      role: "employee",
    });
  } catch (error) {
    next(error);
  }
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
