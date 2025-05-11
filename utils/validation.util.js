import Joi from "joi";

export const departmentSchema = Joi.object({
  name: Joi.string().required().min(2).max(100),
  code: Joi.string()
    .alphanum()
    .required()
    .pattern(/^[A-Z]{3,}$/),
});

export const resourceSchema = Joi.object({
  title: Joi.string().required().min(2).max(200),
  type: Joi.string().required().valid("note", "assignment", "pyq"),
  subject: Joi.string().required().hex().length(24),
});
