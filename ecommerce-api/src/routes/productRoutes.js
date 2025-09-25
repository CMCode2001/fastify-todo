const ProductController = require('../controllers/productController');
const { validateSchema } = require('../middleware/validation');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
  productParamsSchema
} = require('../validators/productValidator');

/**
 * Routes des produits
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function productRoutes(fastify, options) {
  const productController = new ProductController(fastify);
  
  // Schémas communs pour Swagger
  const productSchema = {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      quantity: { type: 'integer' },
      sku: { type: 'string' },
      category: { type: 'string' },
      isActive: { type: 'boolean' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  };
  
  const paginationSchema = {
    type: 'object',
    properties: {
      currentPage: { type: 'integer' },
      totalPages: { type: 'integer' },
      totalCount: { type: 'integer' },
      limit: { type: 'integer' },
      hasNextPage: { type: 'boolean' },
      hasPrevPage: { type: 'boolean' }
    }
  };
  
  // Routes publiques (lecture seule)
  fastify.get('/', {
    schema: {
      tags: ['Products'],
      summary: 'Récupérer tous les produits avec pagination et filtres',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', minimum: 1, default: 1, description: 'Numéro de page' },
          limit: { type: 'integer', minimum: 1, maximum: 100, default: 10, description: 'Nombre d\'éléments par page' },
          search: { type: 'string', maxLength: 255, description: 'Recherche dans nom, description, SKU' },
          category: { type: 'string', maxLength: 100, description: 'Filtrer par catégorie' },
          isActive: { type: 'boolean', description: 'Filtrer par statut actif' },
          sortBy: { type: 'string', enum: ['name', 'price', 'quantity', 'category', 'createdAt', 'updatedAt'], default: 'createdAt', description: 'Champ de tri' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc', description: 'Ordre de tri' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: productSchema
            },
            pagination: paginationSchema
          }
        }
      }
    },
    preHandler: [validateSchema(getProductsQuerySchema, 'query')]
  }, productController.getProducts.bind(productController));
  
  fastify.get('/:id', {
    schema: {
      tags: ['Products'],
      summary: 'Récupérer un produit par son ID',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', format: 'uuid', description: 'ID du produit' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            product: productSchema
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    },
    preHandler: [validateSchema(productParamsSchema, 'params')]
  }, productController.getProductById.bind(productController));
  
  // Routes protégées (authentification requise)
  fastify.register(async function (fastify) {
    // Middleware d'authentification pour toutes les routes de ce groupe
    fastify.addHook('preHandler', authenticate);
    
    // Créer un produit (ADMIN uniquement)
    fastify.post('/', {
      schema: {
        tags: ['Products'],
        summary: 'Créer un nouveau produit (ADMIN)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'price', 'sku', 'category'],
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255, description: 'Nom du produit' },
            description: { type: 'string', maxLength: 2000, description: 'Description du produit' },
            price: { type: 'number', minimum: 0, description: 'Prix du produit' },
            quantity: { type: 'integer', minimum: 0, default: 0, description: 'Quantité en stock' },
            sku: { type: 'string', pattern: '^[A-Z0-9-_]+$', minLength: 3, maxLength: 50, description: 'SKU unique' },
            category: { type: 'string', minLength: 2, maxLength: 100, description: 'Catégorie du produit' },
            isActive: { type: 'boolean', default: true, description: 'Statut actif du produit' }
          }
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              product: productSchema
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
      },
      preHandler: [
        authorize(['ADMIN']),
        validateSchema(createProductSchema)
      ]
    }, productController.createProduct.bind(productController));
    
    // Mettre à jour un produit (ADMIN uniquement)
    fastify.put('/:id', {
      schema: {
        tags: ['Products'],
        summary: 'Mettre à jour un produit (ADMIN)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID du produit' }
          }
        },
        body: {
          type: 'object',
          minProperties: 1,
          properties: {
            name: { type: 'string', minLength: 2, maxLength: 255 },
            description: { type: 'string', maxLength: 2000 },
            price: { type: 'number', minimum: 0 },
            quantity: { type: 'integer', minimum: 0 },
            sku: { type: 'string', pattern: '^[A-Z0-9-_]+$', minLength: 3, maxLength: 50 },
            category: { type: 'string', minLength: 2, maxLength: 100 },
            isActive: { type: 'boolean' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              product: productSchema
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [
        authorize(['ADMIN']),
        validateSchema(productParamsSchema, 'params'),
        validateSchema(updateProductSchema)
      ]
    }, productController.updateProduct.bind(productController));
    
    // Supprimer un produit (ADMIN uniquement)
    fastify.delete('/:id', {
      schema: {
        tags: ['Products'],
        summary: 'Supprimer un produit (ADMIN)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid', description: 'ID du produit' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' }
            }
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              message: { type: 'string' }
            }
          }
        }
      },
      preHandler: [
        authorize(['ADMIN']),
        validateSchema(productParamsSchema, 'params')
      ]
    }, productController.deleteProduct.bind(productController));
    
    // Statistiques des produits (ADMIN uniquement)
    fastify.get('/stats/overview', {
      schema: {
        tags: ['Products'],
        summary: 'Récupérer les statistiques des produits (ADMIN)',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              stats: {
                type: 'object',
                properties: {
                  totalProducts: { type: 'integer' },
                  activeProducts: { type: 'integer' },
                  inactiveProducts: { type: 'integer' },
                  totalValue: { type: 'number' },
                  categoriesCount: { type: 'integer' },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        count: { type: 'integer' }
                      }
                    }
                  },
                  lowStockProducts: { type: 'integer' }
                }
              }
            }
          }
        }
      },
      preHandler: [authorize(['ADMIN'])]
    }, productController.getProductStats.bind(productController));
  });
}

module.exports = productRoutes;