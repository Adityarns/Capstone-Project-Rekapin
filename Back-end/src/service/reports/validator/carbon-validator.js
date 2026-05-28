import Joi from "joi";

export const carbonGoalSchema = Joi.object({
  businessId: Joi.string().required().messages({
    "string.empty": "Business ID wajib diisi",
    "any.required": "Business ID wajib diisi",
  }),
  targetTco2e: Joi.number().positive().required().messages({
    "number.base": "Target karbon harus berupa angka",
    "number.positive": "Target karbon harus lebih dari 0",
    "any.required": "Target karbon wajib diisi",
  }),
  periodStart: Joi.string().isoDate().required().messages({
    "string.isoDate": "Format tanggal mulai tidak valid (gunakan YYYY-MM-DD)",
    "any.required": "Tanggal mulai wajib diisi",
  }),
  periodEnd: Joi.string().isoDate().required().messages({
    "string.isoDate": "Format tanggal akhir tidak valid (gunakan YYYY-MM-DD)",
    "any.required": "Tanggal akhir wajib diisi",
  }),
});
