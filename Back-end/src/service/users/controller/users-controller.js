import UserRepositories from "../repositories/users-repositories.js";
import response from "../../../utils/response.js";
import { InvariantError, NotFoundError } from "../../../exceptions/index.js";

/**
 * @swagger
 * /users:
 *   post:
 *     tags: [Users]
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

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve user information by user ID
 *     parameters:
 *       - in: path
 *         username: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *         example: "user-123"
 *     responses:
 *       200:
 *         description: User retrieved successfully
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
 *                   example: "Akun ditemukan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-123"
 *                     username:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "johndoe@example.com"
 *       404:
 *         description: User not found
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
export const getUserById = async (req, res, next) => {
  const { id } = req.params;
  const user = await UserRepositories.getUserById(id);
  if (!user) {
    return next(new NotFoundError("Akun tidak ditemukan"));
  }
  return response(res, 200, "Akun ditemukan", user);
};
