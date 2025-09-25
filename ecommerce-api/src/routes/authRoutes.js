const AuthController = require('../controllers/authController');
const { validateSchema } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema
} = require('../validators/authValidator');

/**
 * Routes d'authentification
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function authRoutes(fastify, options) {
  const authController = new AuthController(fastify);
  
  // Schémas Swagger pour la documentation
  const registerSwaggerSchema = {
    tags: ['Authentication'],
    summary: 'Inscription d\'un nouvel utilisateur',
    body: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email', description: 'Email de l\'utilisateur' },
        password: { type: 'string', minLength: 8, description: 'Mot de passe (min. 8 caractères avec majuscule, minuscule, chiffre et caractère spécial)' },
        name: { type: 'string', minLength: 2, maxLength: 100, description: 'Nom complet' },
        role: { type: 'string', enum: ['USER', 'ADMIN'], default: 'USER', description: 'Rôle de l\'utilisateur' }
      }
    },
    response: {
      201: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          token: { type: 'string' }
        }
      },
      409: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  };
  
  const loginSwaggerSchema = {
    tags: ['Authentication'],
    summary: 'Connexion d\'un utilisateur',
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', description: 'Email de l\'utilisateur' },
        password: { type: 'string', description: 'Mot de passe' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              name: { type: 'string' },
              role: { type: 'string' },
              createdAt: { type: 'string', format: 'date-time' }
            }
          },
          token: { type: 'string' }
        }
      },
      401: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' }
        }
      }
    }
  };
  
  // Routes publiques
  fastify.post('/register', {
    schema: registerSwaggerSchema,
    preHandler: [validateSchema(registerSchema)]
  }, authController.register.bind(authController));
  
  fastify.post('/login', {
    schema: loginSwaggerSchema,
    preHandler: [validateSchema(loginSchema)]
  }, authController.login.bind(authController));
  
  // Routes protégées
  fastify.register(async function (fastify) {
    // Middleware d'authentification pour toutes les routes de ce groupe
    fastify.addHook('preHandler', authenticate);
    
    // Récupérer le profil
    fastify.get('/profile', {
      schema: {
        tags: ['Authentication'],
        summary: 'Récupérer le profil utilisateur',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }, authController.getProfile.bind(authController));
    
    // Mettre à jour le profil
    fastify.put('/profile', {
      schema: {
        tags: ['Authentication'],
        summary: 'Mettre à jour le profil utilisateur',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string' },
                  role: { type: 'string' },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      },
      preHandler: [validateSchema(updateProfileSchema)]
    }, authController.updateProfile.bind(authController));
    
    // Changer le mot de passe
    fastify.put('/change-password', {
      schema: {
        tags: ['Authentication'],
        summary: 'Changer le mot de passe',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['currentPassword', 'newPassword', 'confirmPassword'],
          properties: {
            currentPassword: { type: 'string' },
            newPassword: { type: 'string', minLength: 8 },
            confirmPassword: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [validateSchema(changePasswordSchema)]
    }, authController.changePassword.bind(authController));
    
    // Déconnexion
    fastify.post('/logout', {
      schema: {
        tags: ['Authentication'],
        summary: 'Déconnexion utilisateur',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          }
        }
      }
    }, authController.logout.bind(authController));
  });
}

module.exports = authRoutes;