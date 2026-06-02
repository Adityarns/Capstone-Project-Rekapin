import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from "../../../exceptions/index.js";
import teamMembersRepositories from "../repositories/team-members-repositories.js";
import authRepositories from "../../auth/repositories/auth-repositories.js";
import response from "../../../utils/response.js";
import crypto from "crypto";
import EmailService from "../email/email-service.js";
import UserRepositories from "../../users/repositories/users-repositories.js";
import businessesRepositories from "../../businesses/repositories/businesses-repositories.js";
import CacheService from "../../cache/redis-cache.js";

const cacheService = new CacheService();

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
  await cacheService.del(`teamMembers_${businessId}`);
  await cacheService.del(`accessibleBusinesses_${userId}`);
  return response(res, 201, "Anggota tim berhasil ditambahkan", teamMember);
};

export const inviteTeamMember = async (req, res, next) => {
  try {
    const { businessId } = req.params;
    const { email } = req.body;

    if (!email) {
      return next(new InvariantError("Alamat email wajib diisi"));
    }

    const role = "employee";

    const businessProfile =
      await businessesRepositories.getBusinessProfileById(businessId);
    if (!businessProfile) {
      return next(new NotFoundError("Bisnis tidak ditemukan"));
    }

    const inviteCode = businessProfile.invitation_code;
    const expiredAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await teamMembersRepositories.createInvitation({
      businessId,
      email,
      role,
      inviteCode,
      expiredAt,
    });

    await EmailService.sendTeamInvitation(
      email,
      inviteCode,
      role,
      businessProfile.business_name,
    );

    // 9. Berikan Respons Sukses ke Frontend
    return response(res, 201, `Email undangan berhasil dikirim ke ${email}`, {
      email,
      role,
    });
  } catch (error) {
    next(error);
  }
};

export const getTeamMembersById = async (req, res, next) => {
  const { businessId } = req.params;
  const cachedTeamMembers = await cacheService.get(`teamMembers_${businessId}`);
  if (cachedTeamMembers) {
    res.setHeader("X-Data-Source", "cache");
    return response(res, 200, "Anggota tim berhasil ditemukan (cache)", {
      teamMembers: JSON.parse(cachedTeamMembers),
    });
  }
  const teamMembers =
    await teamMembersRepositories.getTeamMembersById(businessId);

  // Jika array kosong, berarti tidak ada anggota tim untuk businessId tersebut
  if (!teamMembers || teamMembers.length === 0) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }

  await cacheService.set(
    `teamMembers_${businessId}`,
    JSON.stringify(teamMembers),
  );
  res.setHeader("X-Data-Source", "database");
  return response(res, 200, "Anggota tim berhasil ditemukan", { teamMembers });
};

export const deleteTeamMembersById = async (req, res, next) => {
  const { businessId, userId } = req.params;
  const currentUserId = req.user.user_id;

  const isTeamMemberExist = await teamMembersRepositories.isMember({
    businessId,
    userId,
  });
  if (!isTeamMemberExist) {
    return next(new NotFoundError("Anggota tim tidak ditemukan"));
  }

  const business = await businessesRepositories.getBusinessById(businessId);
  if (!business || business.owner_id !== currentUserId) {
    return next(
      console.log("=== DEBUG OTORISASI HAPUS MEMBER ==="),
      console.log("ID Pengguna Aktif (Token):", currentUserId),
      console.log("Data Lengkap Bisnis dari DB:", business),
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

  await cacheService.del(`teamMembers_${businessId}`);
  await cacheService.del(`accessibleBusinesses_${userId}`);

  return response(
    res,
    200,
    "User berhasil dihapus dari anggota tim",
    teamMember,
  );
};

export const getTeamInvitations = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const userProfile = await UserRepositories.getUserById(userId);
    if (!userProfile) {
      return next(new NotFoundError("Pengguna tidak ditemukan"));
    }

    const invitations = await teamMembersRepositories.getInvitationsByEmail(
      userProfile.email,
    );

    return response(res, 200, "Undangan tim berhasil ditarik", { invitations });
  } catch (error) {
    next(error);
  }
};

export const rejectInvitation = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;

    // Gunakan fungsi delete baru yang memakai invitation_code
    const invitation =
      await teamMembersRepositories.deleteInvitationByCode(inviteCode);

    if (!invitation) {
      return next(
        new NotFoundError("Undangan tidak ditemukan atau sudah kedaluwarsa"),
      );
    }

    return response(res, 200, "Undangan berhasil ditolak", null);
  } catch (error) {
    next(error);
  }
};

export const acceptInvitation = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;
    // Ambil userId yang menerima undangan dari token yang sedang aktif
    const userId = req.user.user_id;

    // Hapus dari tabel undangan sekaligus mengembalikan datanya
    const invitation =
      await teamMembersRepositories.deleteInvitationByCode(inviteCode);

    if (!invitation) {
      return next(new NotFoundError("Undangan tidak valid atau sudah ditarik"));
    }

    const { business_id, role } = invitation;

    // Masukkan pengguna tersebut ke dalam tim bisnis
    const teamMember = await teamMembersRepositories.addTeamMember({
      businessId: business_id,
      userId,
      role,
    });

    if (!teamMember) {
      return next(
        new InvariantError(
          "Gagal menerima undangan dan bergabung ke dalam tim",
        ),
      );
    }
    await cacheService.del(`teamMembers_${business_id}`);
    await cacheService.del(`accessibleBusinesses_${userId}`);
    return response(res, 200, "Undangan berhasil diterima", teamMember);
  } catch (error) {
    next(error);
  }
};
