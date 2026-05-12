import businessesRepositories from "../repositories/businesses-repositories";

export const addBusiness = async (req, res, next) => {
  const { ownerId: user_id } = req.user;
  const { businessName, invitationCode } = req.validated;
  const business = await businessesRepositories.addBusiness({
    ownerId: user_id,
    businessName,
    invitationCode,
  });
  if (!business) {
    return next(new InvariantError("Bisnis gagal ditambahkan"));
  }
  return response(res, 201, "Bisnis berhasil ditambahkan", business);
};
