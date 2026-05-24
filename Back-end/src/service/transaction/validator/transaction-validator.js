import Joi from "joi";

const transactionSchema = Joi.object({
  title: Joi.string().max(100).required(),
  amount: Joi.number().positive().required(),
  quantity: Joi.number().positive().optional(),
  date: Joi.date().required(),
  type: Joi.string().required(),
  description: Joi.string().max(200).optional(),
  businessId: Joi.string().required(),
  categoryId: Joi.string().required(),
});

const transactionUpdateSchema = Joi.object({
  title: Joi.string().max(100).optional(),
  amount: Joi.number().positive().optional(),
  quantity: Joi.number().positive().optional(),
  date: Joi.date().optional(),
  type: Joi.string().optional(),
  description: Joi.string().max(200).optional(),
  businessId: Joi.string().optional(),
  categoryId: Joi.string().optional(),
}).min(1);

const categorySchema = Joi.object({
  category_name: Joi.string().required(),
  category_type: Joi.string().valid("income", "expense").required(),
});

export { transactionSchema, transactionUpdateSchema, categorySchema };
