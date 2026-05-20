import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from "../../../exceptions/index.js";
import teamMembersRepositories from "../repositories/team-members-repositories.js";
import authRepositories from "../../auth/repositories/auth-repositories.js";
import response from "../../../utils/response.js";
import businessesRepositories from "../../businesses/repositories/businesses-repositories.js";

export const addTeamMember = async (req, res, next) => {
  const { businessId } = req.params;
  const { userId, role } = req.validated;
  const teamMember = await teamMembersRepositories.addTeamMember({
    businessId,
    userId,
    role,
  });
  if (!teamMember) {
    return next(new InvariantError("Gagal menambahkan anggota tim"));
  }
  return response(res, 201, "Anggota tim berhasil ditambahkan", teamMember);
};

/**
 * @swagger
 * /businesses/{businessId}/members:
 *   get:
 *     tags: [Team Members]
 *     summary: Get team members by Business ID
 *     description: Menampilkan daftar anggota tim berdasarkan ID bisnis
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Bisnis
 *         example: "business-123"
 *     responses:
 *       200:
 *         description: Anggota tim berhasil ditemukan
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
 *                   example: "Anggota tim berhasil ditemukan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     teamMember:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           username:
 *                             type: string
 *                             example: "Aditya Rahman"
 *                           role:
 *                             type: string
 *                             example: "employee"
 *       404:
 *         description: Anggota tim tidak ditemukan
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
 *                   example: "Anggota tim tidak ditemukan"
 */
export const getTeamMembersById = async (req, res, next) => {
  const { businessId } = req.params;
  const teamMember =
    await teamMembersRepositories.getTeamMembersById(businessId);
  if (!teamMember) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }
  return response(res, 200, "Anggota tim berhasil ditemukan", { teamMember });
};

/**
 * @swagger
 * /businesses/{businessId}/members/{userId}:
 *   delete:
 *     tags: [Team Members]
 *     summary: Delete team member by User ID
 *     description: Menghapus pengguna spesifik dari daftar anggota tim
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Pengguna yang akan dihapus
 *         example: "user-456"
 *     responses:
 *       200:
 *         description: User berhasil dihapus dari anggota tim
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
 *                   example: "User berhasil dihapus dari anggota tim"
 *       400:
 *         description: User gagal dihapus dari anggota tim (Invariant Error)
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
 *                   example: "User gagal dihapus dari anggota tim"
 *       404:
 *         description: Anggota tim tidak ditemukan
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
 *                   example: "Anggota tim tidak ditemukan"
 */
export const deleteTeamMembersById = async (req, res, next) => {
  const { businessId, userId } = req.params;
  const isTeamMemberExist =
    await teamMembersRepositories.getTeamMembersById(userId);
  if (!isTeamMemberExist) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }
  const isOwner = await businessesRepositories.verifyBusinessUpdate(
    userId,
    businessId,
  );
  if (!isOwner) {
    return next(
      new AuthorizationError("Member tidak dapat menghapus anggota tim"),
    );
  }

  const teamMember =
    await teamMembersRepositories.deleteTeamMembersById(userId);
  if (!teamMember) {
    return next(new InvariantError("User gagal dihapus dari anggota tim"));
  }
  return response(
    res,
    200,
    "User berhasil dihapus dari anggota tim",
    teamMember,
  );
};
