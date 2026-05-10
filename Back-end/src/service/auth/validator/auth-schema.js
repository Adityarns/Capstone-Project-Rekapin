import Joi from "joi";
export const postAuthenticationPayloadSchema = Joi.object({
  email: Joi.string().required().email().max(255),
  password: Joi.string().required(),
});
export const putAuthenticationPayloadSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

export const deleteAuthenticationSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
