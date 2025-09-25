const { PrismaClient } = require('@prisma/client');
const { createLogger } = require('./logger');

const logger = createLogger('DatabaseService');

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });
    
    // Écouter les événements Prisma pour les logs
    this.prisma.$on('query', (e) => {
      logger.debug('Query executed', { 
        query: e.query, 
        params: e.params,
        duration: `${e.duration}ms`
      });
    });
    
    this.prisma.$on('error', (e) => {
      logger.error('Database error', { error: e });
    });
    
    this.prisma.$on('info', (e) => {
      logger.info('Database info', { message: e.message });
    });
    
    this.prisma.$on('warn', (e) => {
      logger.warn('Database warning', { message: e.message });
    });
  }
  
  /**
   * Connecte à la base de données
   */
  async connect() {
    try {
      await this.prisma.$connect();
      logger.info('Connexion à la base de données établie');
    } catch (error) {
      logger.error('Erreur de connexion à la base de données', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Déconnecte de la base de données
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      logger.info('Déconnexion de la base de données');
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Exécute une transaction
   * @param {Function} fn - Fonction contenant les opérations de la transaction
   */
  async transaction(fn) {
    try {
      logger.debug('Début de transaction');
      const result = await this.prisma.$transaction(fn);
      logger.debug('Transaction terminée avec succès');
      return result;
    } catch (error) {
      logger.error('Erreur dans la transaction', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Vérifie la santé de la base de données
   */
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      logger.debug('Health check de la base de données réussi');
      return true;
    } catch (error) {
      logger.error('Échec du health check de la base de données', { error: error.message });
      return false;
    }
  }
  
  /**
   * Retourne l'instance Prisma
   */
  getPrisma() {
    return this.prisma;
  }
}

// Singleton instance
let databaseService = null;

function getDatabaseService() {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}

module.exports = {
  DatabaseService,
  getDatabaseService
};