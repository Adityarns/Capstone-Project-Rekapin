import Joi from "joi";

export const registerAuthPayloadSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  businessName: Joi.string().optional().min(3).max(255),
  invitationCode: Joi.string().optional().max(20),
  email: Joi.string().required().email().max(255),
  password: Joi.string().required().min(8),
  role: Joi.string().required(),
});

export const loginAuthPayloadSchema = Joi.object({
  email: Joi.string().required().email().max(255),
  password: Joi.string().required(),
  invitationCode: Joi.string().optional(),
});

export const refreshAuthPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const logoutAuthPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
