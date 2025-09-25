const Joi = require('joi');

/**
 * Schéma de validation pour l'inscription
 */
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'L\'email doit être valide',
      'any.required': 'L\'email est requis'
    }),
    
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
      'any.required': 'Le mot de passe est requis'
    }),
    
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(new RegExp('^[a-zA-ZÀ-ÿ\\s-]+$'))
    .required()
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces et tirets',
      'any.required': 'Le nom est requis'
    }),
    
  role: Joi.string()
    .valid('USER', 'ADMIN')
    .default('USER')
    .messages({
      'any.only': 'Le rôle doit être USER ou ADMIN'
    })
});

/**
 * Schéma de validation pour la connexion
 */
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'L\'email doit être valide',
      'any.required': 'L\'email est requis'
    }),
    
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe est requis'
    })
});

/**
 * Schéma de validation pour la modification du profil
 */
const updateProfileSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(new RegExp('^[a-zA-ZÀ-ÿ\\s-]+$'))
    .messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces et tirets'
    }),
    
  email: Joi.string()
    .email()
    .messages({
      'string.email': 'L\'email doit être valide'
    })
});

/**
 * Schéma de validation pour le changement de mot de passe
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Le mot de passe actuel est requis'
    }),
    
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial',
      'any.required': 'Le nouveau mot de passe est requis'
    }),
    
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'La confirmation du mot de passe ne correspond pas',
      'any.required': 'La confirmation du mot de passe est requise'
    })
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
};