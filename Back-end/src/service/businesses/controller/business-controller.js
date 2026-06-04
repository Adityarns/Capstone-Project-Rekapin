import businessesRepositories from "../repositories/businesses-repositories.js";
import {
  AuthorizationError,
  InvariantError,
  NotFoundError,
} from "../../../exceptions/index.js";
import response from "../../../utils/response.js";
import CacheService from "../../cache/redis-cache.js";

const cacheService = new CacheService();

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
  await cacheService.del(`accessibleBusinesses_${user_id}`); // Invalidate cache untuk daftar bisnis yang bisa diakses user
  return response(res, 201, "Bisnis berhasil ditambahkan", business);
};

export const getBusinessById = async (req, res, next) => {
  const { businessId } = req.params;
  const userId = req.user.user_id;

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
  const cacheKey = `business_${businessId}`;
  const cachedData = await cacheService.get(cacheKey);
  if (cachedData) {
    res.setHeader("X-Data-Source", "cache");
    const parsedData =
      typeof cachedData === "string" ? JSON.parse(cachedData) : cachedData;
    return response(res, 200, "Business ditemukan (cache)", parsedData);
  }
  const business = await businessesRepositories.getBusinessById(businessId);
  if (!business) {
    return next(new NotFoundError("Business tidak ditemukan"));
  }
  await cacheService.set(cacheKey, JSON.stringify(business));
  res.setHeader("X-Data-Source", "database");
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

  await cacheService.del(`business_${businessId}`); // Invalidate cache untuk bisnis yang diperbarui
  return response(res, 200, "Business berhasil diperbarui", business);
};

export const getAccessibleBusiness = async (req, res, next) => {
  const userId = req.params.userId;
  const business = await businessesRepositories.getAccessibleBusinesses(userId);
  if (!business) {
    return next(
      new NotFoundError("Anda tidak memiliki akses ke bisnis manapun"),
    );
  }
  return response(res, 200, "Business ditemukan", business);
};
