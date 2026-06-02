import Joi from "joi";

export const editBusinessPayloadSchema = Joi.object({
  business_name: Joi.string().max(100),
  industry: Joi.string().max(100),
  phone_number: Joi.string().max(20),
  address: Joi.string().max(200),
  modal: Joi.number().min(0),
});
