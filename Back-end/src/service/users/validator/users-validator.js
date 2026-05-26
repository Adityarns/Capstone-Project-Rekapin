import Joi from "joi";

export const userUpdatePayloadSchema = Joi.object({
  username: Joi.string().min(3).max(50),
  email: Joi.string().email().max(255),
  password: Joi.string().min(8),
});

export const userChangePasswordPayloadSchema = Joi.object({
  currentPassword: Joi.string().min(8).required(),
  newPassword: Joi.string().min(8).required(),
});
