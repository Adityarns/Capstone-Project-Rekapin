import businessesRepositories from "../repositories/businesses-repositories.js";
import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from "../../../exceptions/index.js";
import response from "../../../utils/response.js";

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

export const getBusinessById = async (req, res, next) => {
  const { businessId } = req.params;
  const userId = req.user.user_id;

  const business = await businessesRepositories.getBusinessById(businessId);
  if (!business) {
    return next(new NotFoundError("Business tidak ditemukan"));
  }

  const hasAccess = await businessesRepositories.verifyBusinessAccess(
    userId,
    businessId,
  );
  if (!hasAccess) {
    return next(
      new AuthorizationError(
        "Anda tidak memiliki akses untuk melihat data bisnis ini",
      ),
    );
  }

  return response(res, 200, "Business ditemukan", business);
};

export const editBusinessById = async (req, res, next) => {
  const { businessId } = req.params;
  const userId = req.user.user_id;

  const isBusinessExist =
    await businessesRepositories.getBusinessById(businessId);
  if (!isBusinessExist) {
    return next(new NotFoundError("Business tidak ditemukan"));
  }

  const isOwner = await businessesRepositories.verifyBusinessAccess(
    userId,
    businessId,
  );
  if (!isOwner) {
    return next(
      new AuthorizationError(
        "Anda tidak memiliki akses untuk mengedit bisnis ini",
      ),
    );
  }

  const payload = req.validated;
  const business = await businessesRepositories.editBusinessById({
    businessId,
    ...payload,
  });

  if (!business) {
    return next(new InvariantError("Business gagal diperbarui"));
  }

  return response(res, 200, "Business berhasil diperbarui", business);
};
