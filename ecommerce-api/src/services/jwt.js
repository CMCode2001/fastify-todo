const jwt = require('jsonwebtoken');
const config = require('../config');
const { createLogger } = require('./logger');

const logger = createLogger('JWTService');

class JWTService {
  /**
   * Génère un token JWT
   * @param {Object} payload - Les données à inclure dans le token
   * @returns {string} Le token JWT
   */
  static generateToken(payload) {
    try {
      const token = jwt.sign(
        payload,
        config.jwt.secret,
        { 
          expiresIn: config.jwt.expiresIn,
          issuer: 'ecommerce-api',
          audience: 'ecommerce-client'
        }
      );
      
      logger.debug('Token JWT généré avec succès', { userId: payload.id });
      return token;
    } catch (error) {
      logger.error('Erreur lors de la génération du token JWT', { error: error.message });
      throw new Error('Erreur lors de la génération du token');
    }
  }
  
  /**
   * Vérifie et décode un token JWT
   * @param {string} token - Le token à vérifier
   * @returns {Object} Les données décodées du token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(token, config.jwt.secret, {
        issuer: 'ecommerce-api',
        audience: 'ecommerce-client'
      });
      
      logger.debug('Token JWT vérifié avec succès', { userId: decoded.id });
      return decoded;
    } catch (error) {
      logger.error('Erreur lors de la vérification du token JWT', { error: error.message });
      
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expiré');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Token invalide');
      } else {
        throw new Error('Erreur lors de la vérification du token');
      }
    }
  }
  
  /**
   * Décode un token sans le vérifier (pour le debugging)
   * @param {string} token - Le token à décoder
   * @returns {Object} Les données décodées du token
   */
  static decodeToken(token) {
    try {
      const decoded = jwt.decode(token, { complete: true });
      logger.debug('Token JWT décodé avec succès');
      return decoded;
    } catch (error) {
      logger.error('Erreur lors du décodage du token JWT', { error: error.message });
      throw new Error('Erreur lors du décodage du token');
    }
  }
}

module.exports = JWTService;