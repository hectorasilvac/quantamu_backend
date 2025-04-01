import Joi from 'joi'

export const aggregatedSchema = Joi.object({
  symbols: Joi.string()
    .pattern(/^[a-zA-Z]+(,[a-zA-Z]+)*$/, { name: "symbols" })
    .required()
    .messages({
      "string.base": `"symbols" must be a string`,
      "string.pattern.base": `"symbols" must be a comma-separated list of words with letters only`,
      'any.required': `"symbol" is required`,
    }),
})

export const updateSchema = Joi.object({
  date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .messages({
      "string.base": `"date" must be a string`,
      "string.pattern.base": `"date" must follow the format YYYY-MM-DD`,
    }),
})

export const getSymbolsSchema = Joi.object({
  search: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .optional()
    .messages({
      'string.base': `"search" must be a string`,
      'string.pattern.base': `"search" must contain only letters`,
    })
})

export const groupedSchema = Joi.object({
  symbols: Joi.string()
    .pattern(/^[a-zA-Z]+(,[a-zA-Z]+)*$/, { name: "symbols" })
    .optional()
    .messages({
      "string.base": `"symbols" must be a string`,
      "string.pattern.base": `"symbols" must be a comma-separated list of words with letters only`,
    }),
})

export const stratBySymbolSchema = Joi.object({
  symbol: Joi.string()
    .pattern(/^[A-Za-z]+(,[A-Za-z]+)*$/)
    .required()
    .messages({
      'string.base': `"symbol" must be a string`,
      'string.pattern.base': `"symbol" must contain only letters`,
      'any.required': `"symbol" is required`
    })
})

