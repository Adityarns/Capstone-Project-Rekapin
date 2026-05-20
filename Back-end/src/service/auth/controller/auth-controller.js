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
import businessesRepositories from "../../businesses/repositories/businesses-repositories.js";

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user
 *     description: Register a new user with role-based business creation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "John Doe"
 *               businessName:
 *                 type: string
 *                 example: "My Business"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               role:
 *                 type: string
 *                 enum: [owner, employee]
 *                 example: "owner"
 *               invitationCode:
 *                 type: string
 *                 example: "INVITE123"
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Akun dan bisnis berhasil dibuat"
 *                 data:
 *                   type: object
 *                   properties:
 *                     username:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     role:
 *                       type: string
 *                       example: "owner"
 *                     userId:
 *                       type: string
 *                       example: "user-xyz123"
 *                     businessName:
 *                       type: string
 *                       description: "Hanya tersedia jika mendaftar sebagai owner"
 *                       example: "My Business"
 *       400:
 *         description: Bad Request (Validation failed or Invariant Error)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 *                   example: "Email sudah digunakan"
 */
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

    const data = { username, email, role, userId, businessName };

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

  return response(res, 201, "Akun berhasil dibuat", {
    data,
  });
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login user
 *     description: Authenticate user and optionally join business with invitation code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "johndoe@example.com"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               invitationCode:
 *                 type: string
 *                 example: "ABC123"
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Authentication berhasil ditambahkan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       400:
 *         description: Authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 */
export const login = async (req, res, next) => {
  const { email, password, invitationCode } = req.validated;

  const userId = await UserRepositories.verifyUserCredential(email, password);
  if (!userId) {
    return next(new AuthenticationError("Kredensial yang Anda berikan salah"));
  }

  // ================================================
  //  Jika invitation code diisi → gabungkan ke bisnis
  // ================================================
  if (invitationCode) {
    const isOwner = await businessesRepositories.verifyBusinessOwner(userId);
    if (isOwner) {
      return next(
        new InvariantError(
          "Pemilik UMKM tidak dapat bergabung dengan bisnis lain",
        ),
      );
    }

    const business =
      await BusinessRepositories.findByInvitationCode(invitationCode);
    if (!business) {
      return next(new InvariantError("Kode undangan tidak valid"));
    }

    // Cek apakah user sudah terdaftar di bisnis ini
    const alreadyMember = await TeamMemberRepositories.isMember({
      businessId: business.business_id,
      userId,
    });

    if (!alreadyMember) {
      await TeamMemberRepositories.addTeamMember({
        businessId: business.business_id,
        userId,
        role: "employee",
      });
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

/**
 * @swagger
 * /auth/refresh:
 *   put:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Generate new access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh-token-value"
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                   example: "Access Token berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       400:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 */
export const refreshToken = async (req, res, next) => {
  const { refreshToken } = req.validated;

  const result = await AuthenticationRepositories.verifyRefreshToken(
    TokenManager.hashToken(refreshToken),
  );
  if (!result) {
    return next(new InvariantError("Refresh token tidak valid"));
  }

  const { user_id } = TokenManager.verifyRefreshToken(refreshToken);
  const accessToken = TokenManager.generateAccessToken({ user_id });

  return response(res, 200, "Access Token berhasil diperbarui", {
    accessToken,
  });
};

/**
 * @swagger
 * /auth/logout:
 *   delete:
 *     tags: [Authentication]
 *     summary: Logout user
 *     description: Revoke refresh token and logout user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "refresh-token-value"
 *             required:
 *               - refreshToken
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "success"
 *                 message:
 *                   type: string
 *                 data: {}
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "fail"
 *                 message:
 *                   type: string
 */
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
