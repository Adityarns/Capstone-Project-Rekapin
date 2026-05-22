import Joi from "joi";

const transactionSchema = Joi.object({
  amount: Joi.number().positive().required(),
  transaction_date: Joi.date().required(),
  transaction_type: Joi.string().required(),
  description: Joi.string().max(200).optional(),
  businessId: Joi.string().required(),
  categoryId: Joi.string().required(),
});

const transactionUpdateSchema = Joi.object({
  amount: Joi.number().positive().optional(),
  transaction_date: Joi.date().optional(),
  transaction_type: Joi.string().optional(),
  description: Joi.string().max(200).optional(),
  businessId: Joi.string().optional(),
  categoryId: Joi.string().optional(),
}).min(1);

export { transactionSchema, transactionUpdateSchema };
