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

/**
 * @swagger
 * /businesses/{businessId}:
 *   get:
 *     tags: [Businesses]
 *     summary: Get business by ID
 *     description: Mengambil informasi detail profil bisnis UMKM berdasarkan ID bisnis
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Bisnis yang dicari
 *         example: "business-123"
 *     responses:
 *       200:
 *         description: Business ditemukan
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
 *                   example: "Business ditemukan"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "business-123"
 *                     name:
 *                       type: string
 *                       example: "Wijaya Furniture"
 *                     industry:
 *                       type: string
 *                       example: "Home & Furniture"
 *                     phone_number:
 *                       type: string
 *                       example: "+62 812-3456-7890"
 *                     address:
 *                       type: string
 *                       example: "Jl. Sukapura No. 45, Bandung"
 *                     invitation_code:
 *                       type: string
 *                       example: "REKAPIN-2024"
 *       404:
 *         description: Business tidak ditemukan
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
 *                   example: "Business tidak ditemukan"
 */
export const getBusinessById = async (req, res, next) => {
  const { businessId } = req.params;
  const userId = req.user;

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

/**
 * @swagger
 * /businesses/{businessId}:
 *   put:
 *     tags: [Businesses]
 *     summary: Edit business by ID
 *     description: Memperbarui informasi profil bisnis UMKM berdasarkan ID bisnis
 *     parameters:
 *       - in: path
 *         name: businessId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID Bisnis yang akan diperbarui
 *         example: "business-123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Wijaya Furniture"
 *               industry:
 *                 type: string
 *                 example: "Home & Furniture"
 *               phone_number:
 *                 type: string
 *                 example: "+62 812-3456-7890"
 *               address:
 *                 type: string
 *                 example: "Jl. Sukapura No. 45, Bandung"
 *     responses:
 *       200:
 *         description: Business berhasil diperbarui
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
 *                   example: "Business berhasil diperbarui"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "business-123"
 *                     name:
 *                       type: string
 *                       example: "Wijaya Furniture"
 *                     industry:
 *                       type: string
 *                       example: "Home & Furniture"
 *       400:
 *         description: Business gagal diperbarui (Invariant Error) atau Payload tidak valid
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
 *                   example: "Business gagal diperbarui"
 *       404:
 *         description: Business tidak ditemukan
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
 *                   example: "Business tidak ditemukan"
 */
export const editBusinessById = async (req, res, next) => {
  const { businessId } = req.params;
  const userId = req.user;

  const isBusinessExist =
    await businessesRepositories.getBusinessById(businessId);
  if (!isBusinessExist) {
    return next(new NotFoundError("Business tidak ditemukan"));
  }

  const isOwner = await businessesRepositories.verifyBusinessOwner(
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
