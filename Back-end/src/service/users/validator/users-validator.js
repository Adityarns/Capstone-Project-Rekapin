import Joi from "joi";

export const userPayloadSchema = Joi.object({
  name: Joi.string().required().min(3).max(50),
  email: Joi.string().required().email().max(255),
  password: Joi.string().required().min(8),
  role: Joi.string().required(),
});
