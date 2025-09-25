/**
 * Point d'entrée pour toutes les routes de l'API
 * @param {FastifyInstance} fastify
 * @param {Object} options
 */
async function routes(fastify, options) {
  // Route de santé
  fastify.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Vérifier la santé de l\'API',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' }
          }
        }
      }
    }
  }, async (request, reply) => {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };
  });
  
  // Enregistrer les routes d'authentification
  fastify.register(require('./authRoutes'), { prefix: '/auth' });
  
  // Enregistrer les routes des produits
  fastify.register(require('./productRoutes'), { prefix: '/products' });
}

module.exports = routes;