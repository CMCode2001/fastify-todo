const bcrypt = require('bcryptjs');
const config = require('../config');
const { createLogger } = require('./logger');

const logger = createLogger('HashService');

class HashService {
  /**
   * Hache un mot de passe
   * @param {string} password - Le mot de passe à hacher
   * @returns {Promise<string>} Le mot de passe haché
   */
  static async hashPassword(password) {
    try {
      const salt = await bcrypt.genSalt(config.security.bcryptRounds);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      logger.debug('Mot de passe haché avec succès');
      return hashedPassword;
    } catch (error) {
      logger.error('Erreur lors du hachage du mot de passe', { error: error.message });
      throw new Error('Erreur lors du hachage du mot de passe');
    }
  }
  
  /**
   * Vérifie un mot de passe
   * @param {string} password - Le mot de passe en clair
   * @param {string} hashedPassword - Le mot de passe haché
   * @returns {Promise<boolean>} True si le mot de passe correspond
   */
  static async verifyPassword(password, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(password, hashedPassword);
      
      logger.debug('Vérification du mot de passe', { isValid });
      return isValid;
    } catch (error) {
      logger.error('Erreur lors de la vérification du mot de passe', { error: error.message });
      throw new Error('Erreur lors de la vérification du mot de passe');
    }
  }
}

module.exports = HashService;