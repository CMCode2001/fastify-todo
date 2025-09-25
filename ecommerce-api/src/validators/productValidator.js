const Joi = require('joi');

/**
 * Schéma de validation pour la création d'un produit
 */
const createProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Le nom du produit doit contenir au moins 2 caractères',
      'string.max': 'Le nom du produit ne peut pas dépasser 255 caractères',
      'any.required': 'Le nom du produit est requis'
    }),
    
  description: Joi.string()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'La description ne peut pas dépasser 2000 caractères'
    }),
    
  price: Joi.number()
    .precision(2)
    .positive()
    .required()
    .messages({
      'number.positive': 'Le prix doit être positif',
      'any.required': 'Le prix est requis'
    }),
    
  quantity: Joi.number()
    .integer()
    .min(0)
    .default(0)
    .messages({
      'number.integer': 'La quantité doit être un nombre entier',
      'number.min': 'La quantité ne peut pas être négative'
    }),
    
  sku: Joi.string()
    .pattern(new RegExp('^[A-Z0-9-_]+$'))
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Le SKU ne peut contenir que des lettres majuscules, chiffres, tirets et underscores',
      'string.min': 'Le SKU doit contenir au moins 3 caractères',
      'string.max': 'Le SKU ne peut pas dépasser 50 caractères',
      'any.required': 'Le SKU est requis'
    }),
    
  category: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'La catégorie doit contenir au moins 2 caractères',
      'string.max': 'La catégorie ne peut pas dépasser 100 caractères',
      'any.required': 'La catégorie est requise'
    }),
    
  isActive: Joi.boolean()
    .default(true)
});

/**
 * Schéma de validation pour la mise à jour d'un produit
 */
const updateProductSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .messages({
      'string.min': 'Le nom du produit doit contenir au moins 2 caractères',
      'string.max': 'Le nom du produit ne peut pas dépasser 255 caractères'
    }),
    
  description: Joi.string()
    .max(2000)
    .allow('')
    .messages({
      'string.max': 'La description ne peut pas dépasser 2000 caractères'
    }),
    
  price: Joi.number()
    .precision(2)
    .positive()
    .messages({
      'number.positive': 'Le prix doit être positif'
    }),
    
  quantity: Joi.number()
    .integer()
    .min(0)
    .messages({
      'number.integer': 'La quantité doit être un nombre entier',
      'number.min': 'La quantité ne peut pas être négative'
    }),
    
  sku: Joi.string()
    .pattern(new RegExp('^[A-Z0-9-_]+$'))
    .min(3)
    .max(50)
    .messages({
      'string.pattern.base': 'Le SKU ne peut contenir que des lettres majuscules, chiffres, tirets et underscores',
      'string.min': 'Le SKU doit contenir au moins 3 caractères',
      'string.max': 'Le SKU ne peut pas dépasser 50 caractères'
    }),
    
  category: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'La catégorie doit contenir au moins 2 caractères',
      'string.max': 'La catégorie ne peut pas dépasser 100 caractères'
    }),
    
  isActive: Joi.boolean()
}).min(1).messages({
  'object.min': 'Au moins un champ doit être fourni pour la mise à jour'
});

/**
 * Schéma de validation pour les paramètres de requête
 */
const getProductsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.integer': 'Le numéro de page doit être un entier',
      'number.min': 'Le numéro de page doit être supérieur à 0'
    }),
    
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.integer': 'La limite doit être un entier',
      'number.min': 'La limite doit être supérieure à 0',
      'number.max': 'La limite ne peut pas dépasser 100'
    }),
    
  search: Joi.string()
    .max(255)
    .messages({
      'string.max': 'La recherche ne peut pas dépasser 255 caractères'
    }),
    
  category: Joi.string()
    .max(100)
    .messages({
      'string.max': 'La catégorie ne peut pas dépasser 100 caractères'
    }),
    
  isActive: Joi.boolean(),
    
  sortBy: Joi.string()
    .valid('name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt')
    .default('createdAt')
    .messages({
      'any.only': 'Le tri ne peut se faire que par name, price, quantity, category, createdAt ou updatedAt'
    }),
    
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'L\'ordre de tri doit être asc ou desc'
    })
});

/**
 * Schéma de validation pour les paramètres d'URL
 */
const productParamsSchema = Joi.object({
  id: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.uuid': 'L\'ID doit être un UUID valide',
      'any.required': 'L\'ID du produit est requis'
    })
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  productParamsSchema
};