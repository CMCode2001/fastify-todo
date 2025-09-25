const { createLogger } = require('./logger');

const logger = createLogger('RedisService');

class RedisService {
  constructor(fastify) {
    this.redis = fastify.redis;
  }
  
  /**
   * Stocke une valeur dans Redis avec expiration
   * @param {string} key - La clé
   * @param {any} value - La valeur à stocker
   * @param {number} ttl - Temps de vie en secondes (optionnel)
   */
  async set(key, value, ttl = null) {
    try {
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
        logger.debug(`Clé stockée dans Redis avec TTL`, { key, ttl });
      } else {
        await this.redis.set(key, serializedValue);
        logger.debug(`Clé stockée dans Redis`, { key });
      }
    } catch (error) {
      logger.error('Erreur lors du stockage dans Redis', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Récupère une valeur depuis Redis
   * @param {string} key - La clé
   * @returns {any} La valeur désérialisée ou null
   */
  async get(key) {
    try {
      const value = await this.redis.get(key);
      
      if (value === null) {
        logger.debug(`Clé non trouvée dans Redis`, { key });
        return null;
      }
      
      const deserializedValue = JSON.parse(value);
      logger.debug(`Clé récupérée depuis Redis`, { key });
      return deserializedValue;
    } catch (error) {
      logger.error('Erreur lors de la récupération depuis Redis', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Supprime une clé de Redis
   * @param {string} key - La clé à supprimer
   */
  async del(key) {
    try {
      const result = await this.redis.del(key);
      logger.debug(`Clé supprimée de Redis`, { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      logger.error('Erreur lors de la suppression dans Redis', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Vérifie si une clé existe dans Redis
   * @param {string} key - La clé
   * @returns {boolean} True si la clé existe
   */
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      logger.debug(`Vérification d'existence dans Redis`, { key, exists: result === 1 });
      return result === 1;
    } catch (error) {
      logger.error('Erreur lors de la vérification d\'existence dans Redis', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Définit l'expiration d'une clé
   * @param {string} key - La clé
   * @param {number} ttl - Temps de vie en secondes
   */
  async expire(key, ttl) {
    try {
      const result = await this.redis.expire(key, ttl);
      logger.debug(`Expiration définie dans Redis`, { key, ttl, success: result === 1 });
      return result === 1;
    } catch (error) {
      logger.error('Erreur lors de la définition d\'expiration dans Redis', { key, ttl, error: error.message });
      throw error;
    }
  }
  
  /**
   * Incrémente une valeur numérique
   * @param {string} key - La clé
   * @returns {number} La nouvelle valeur
   */
  async incr(key) {
    try {
      const result = await this.redis.incr(key);
      logger.debug(`Incrémentation dans Redis`, { key, newValue: result });
      return result;
    } catch (error) {
      logger.error('Erreur lors de l\'incrémentation dans Redis', { key, error: error.message });
      throw error;
    }
  }
  
  /**
   * Recherche les clés correspondant à un pattern
   * @param {string} pattern - Le pattern de recherche
   * @returns {Array} Liste des clés trouvées
   */
  async keys(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      logger.debug(`Recherche de clés dans Redis`, { pattern, count: keys.length });
      return keys;
    } catch (error) {
      logger.error('Erreur lors de la recherche de clés dans Redis', { pattern, error: error.message });
      throw error;
    }
  }
}

module.exports = RedisService;