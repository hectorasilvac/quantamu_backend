import Joi from 'joi'

export const addCategorySchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.base': `"name" must be a string`,
      'string.pattern.base': `"name" must contain only letters`,
      'any.required': `"name" is required`
    })
})

export const addInstrumentSchema = Joi.array()
  .items(
    Joi.object({
      symbol: Joi.string().required().messages({
        'string.base': `"symbol" must be a string`,
        'any.required': `"symbol" is required`
      }),

      name: Joi.string().required().messages({
        'string.base': `"name" must be a string`,
        'any.required': `"name" is required`
      }),

      idCategory: Joi.number().required().messages({
        'number.base': `"idCategory" must be a number`,
        'any.required': `"idCategory" is required`
      })
    })
  )
  .min(1) // Asegura que haya al menos un objeto en el array
  .required()
  .messages({
    'array.base': `"instruments" must be an array`,
    'any.required': `"instruments" is required`,
    'array.min': `"instruments" must contain at least one item`
  })

export const editCategorySchema = Joi.object({
  name: Joi.string()
    .pattern(/^[A-Za-z]+$/)
    .required()
    .messages({
      'string.base': `"name" must be a string`,
      'string.pattern.base': `"name" must contain only letters`,
      'any.required': `"name" is required`
    }),

  id: Joi.string()
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.base': `"id" must be a string`,
      'string.pattern.base': `"id" must contain only numbers`,
      'any.required': `"id" is required`
    })
})

export const getInstrumentsSchema = Joi.object({
  type: Joi.string()
    .valid("future", "sector", "stock", "all")
    .required()
    .messages({
      "any.only": `"type" must be one of [future, sector, stock, all]`,
      "any.required": `"type" is required`,
    }),
});