const fastify = require('fastify');
const config = require('./config');
const { getDatabaseService } = require('./services/database');
const { logger } = require('./services/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error');

// Créer l'instance Fastify
const app = fastify({
  logger: {
    level: config.logging.level,
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname'
      }
    }
  },
  trustProxy: true
});

// Fonction d'initialisation de l'application
async function buildApp() {
  try {
    // Enregistrer le plugin CORS
    await app.register(require('@fastify/cors'), {
      origin: config.cors.origin,
      credentials: true
    });
    
    // Enregistrer le plugin Helmet pour la sécurité
    await app.register(require('@fastify/helmet'), {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"]
        }
      }
    });
    
    // Enregistrer le plugin Redis
    await app.register(require('@fastify/redis'), {
      url: config.redis.url,
      family: 4
    });
    
    // Enregistrer le plugin JWT
    await app.register(require('@fastify/jwt'), {
      secret: config.jwt.secret
    });
    
    // Enregistrer le plugin Rate Limiting
    await app.register(require('@fastify/rate-limit'), {
      max: config.rateLimit.max,
      timeWindow: config.rateLimit.window,
      keyGenerator: (request) => {
        return request.user?.id || request.ip;
      }
    });
    
    // Configuration Swagger
    await app.register(require('@fastify/swagger'), {
      openapi: {
        openapi: '3.0.0',
        info: {
          title: 'E-commerce API',
          description: 'API e-commerce complète avec Fastify, MySQL, Prisma, Redis et JWT',
          version: '1.0.0',
          contact: {
            name: 'API Support',
            email: 'support@ecommerce-api.com'
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
          }
        },
        servers: [
          {
            url: `http://localhost:${config.port}`,
            description: 'Serveur de développement'
          }
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT'
            }
          }
        },
        tags: [
          {
            name: 'Health',
            description: 'Endpoints de santé de l\'API'
          },
          {
            name: 'Authentication',
            description: 'Gestion de l\'authentification et des utilisateurs'
          },
          {
            name: 'Products',
            description: 'Gestion des produits'
          }
        ]
      },
      hideUntagged: true,
      exposeRoute: true
    });
    
    // Interface Swagger UI
    await app.register(require('@fastify/swagger-ui'), {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false
      },
      staticCSP: true,
      transformSpecificationClone: true
    });
    
    // Hook pour logger les requêtes
    app.addHook('onRequest', async (request, reply) => {
      logger.http(`${request.method} ${request.url}`, {
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
    });
    
    // Hook pour logger les réponses
    app.addHook('onResponse', async (request, reply) => {
      logger.http(`Response ${reply.statusCode}`, {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.elapsedTime
      });
    });
    
    // Middleware de gestion d'erreurs
    app.setErrorHandler(errorHandler);
    app.setNotFoundHandler(notFoundHandler);
    
    // Enregistrer les routes
    await app.register(require('./routes'), { prefix: '/api/v1' });
    
    // Route racine avec informations API
    app.get('/', async (request, reply) => {
      return {
        name: 'E-commerce API',
        version: '1.0.0',
        description: 'API e-commerce complète avec Fastify, MySQL, Prisma, Redis et JWT',
        documentation: '/docs',
        health: '/api/v1/health',
        endpoints: {
          auth: '/api/v1/auth',
          products: '/api/v1/products'
        }
      };
    });
    
    // Hook pour nettoyer à l'arrêt
    app.addHook('onClose', async (instance, done) => {
      logger.info('Fermeture de l\'application...');
      
      try {
        // Fermer la connexion à la base de données
        await getDatabaseService().disconnect();
        logger.info('Base de données déconnectée');
      } catch (error) {
        logger.error('Erreur lors de la fermeture de la base de données', { error: error.message });
      }
      
      done();
    });
    
    logger.info('Application Fastify configurée avec succès');
    return app;
    
  } catch (error) {
    logger.error('Erreur lors de la configuration de l\'application', { error: error.message });
    throw error;
  }
}

// Fonction de démarrage du serveur
async function start() {
  try {
    // Construire l'application
    const app = await buildApp();
    
    // Connecter à la base de données
    await getDatabaseService().connect();
    logger.info('Connexion à la base de données établie');
    
    // Démarrer le serveur
    await app.listen({
      port: config.port,
      host: config.host
    });
    
    logger.info(`🚀 Serveur démarré sur http://${config.host}:${config.port}`);
    logger.info(`📚 Documentation disponible sur http://${config.host}:${config.port}/docs`);
    
    // Gérer l'arrêt propre
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Signal ${signal} reçu, arrêt du serveur...`);
        try {
          await app.close();
          logger.info('Serveur arrêté proprement');
          process.exit(0);
        } catch (error) {
          logger.error('Erreur lors de l\'arrêt du serveur', { error: error.message });
          process.exit(1);
        }
      });
    });
    
  } catch (error) {
    logger.error('Erreur fatale lors du démarrage', { error: error.message });
    process.exit(1);
  }
}

// Démarrer l'application si ce fichier est exécuté directement
if (require.main === module) {
  start();
}

module.exports = { buildApp, start };