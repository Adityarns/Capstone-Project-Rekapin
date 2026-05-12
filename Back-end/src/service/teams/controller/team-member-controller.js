import teamMembersRepositories from "../repositories/team-members-repositories";

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
