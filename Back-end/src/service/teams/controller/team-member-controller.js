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

export const getTeamMembersById = async (req, res, next) => {
  const { businessId } = req.params;
  const teamMembers =
    await teamMembersRepositories.getTeamMembersById(businessId);

  // Jika array kosong, berarti tidak ada anggota tim untuk businessId tersebut
  if (!teamMembers || teamMembers.length === 0) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }

  return response(res, 200, "Anggota tim berhasil ditemukan", { teamMembers });
};

export const deleteTeamMembersById = async (req, res, next) => {
  const { businessId, userId } = req.params;
  const isTeamMemberExist =
    await teamMembersRepositories.getTeamMembersById(userId);
  if (!isTeamMemberExist) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }
  const isOwner = await businessesRepositories.verifyBusinessAccess(
    userId,
    businessId,
  );
  if (!isOwner) {
    return next(
      new AuthorizationError("Member tidak dapat menghapus anggota tim"),
    );
  }

  const teamMember = await teamMembersRepositories.deleteTeamMembersById(
    userId,
    businessId,
  );
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
