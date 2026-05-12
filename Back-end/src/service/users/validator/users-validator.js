import Joi from "joi";

export const userPayloadSchema = Joi.object({
  username: Joi.string().required().min(3).max(50),
  businessName: Joi.string().optional().min(3).max(255),
  invitationCode: Joi.string().optional().max(20),
  email: Joi.string().required().email().max(255),
  password: Joi.string().required().min(8),
  role: Joi.string().required(),
});
