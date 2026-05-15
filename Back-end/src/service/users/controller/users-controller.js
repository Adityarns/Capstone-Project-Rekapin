import UserRepositories from "../repositories/users-repositories.js";
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

/**
 * @swagger
 * /users/{userId}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     description: Retrieve user information by user ID
 *     parameters:
 *       - in: path
 *         name: userId
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
  const { userId } = req.params;
  const user = await UserRepositories.getUserById(userId);
  if (!user) {
    return next(new NotFoundError("Akun tidak ditemukan"));
  }
  return response(res, 200, "Akun ditemukan", user);
};

/**
 * @swagger
 * /users/{userId}:
 *   put:
 *     tags: [Users]
 *     summary: Edit user by ID
 *     description: Memperbarui informasi pengguna berdasarkan ID pengguna
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pengguna
 *         example: "user-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "Aditya Rahman"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "aditya@example.com"
 *               password:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: User berhasil diperbarui
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
 *                   example: "User berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "user-123"
 *                     username:
 *                       type: string
 *                       example: "Aditya Rahman"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "aditya@example.com"
 *       400:
 *         description: User gagal diperbarui (Invariant Error) atau Payload tidak valid
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
 *                   example: "User gagal diperbarui"
 *       404:
 *         description: User tidak ditemukan
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
 *                   example: "User tidak ditemukan"
 */
export const editUserById = async (req, res, next) => {
  const { userId } = req.params;
  const isUserExist = await UserRepositories.getUserById(userId);
  if (!isUserExist) {
    return next(new NotFoundError("User tidak ditemukan"));
  }
  const payload = req.validated;
  const user = await UserRepositories.editUserById({
    userId,
    ...payload,
  });
  if (!user) {
    return next(new InvariantError("User gagal diperbarui"));
  }
  return response(res, 200, "User berhasil diperbarui", user);
};
