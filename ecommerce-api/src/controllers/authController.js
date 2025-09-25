const { getDatabaseService } = require('../services/database');
const HashService = require('../services/hash');
const JWTService = require('../services/jwt');
const RedisService = require('../services/redis');
const { createLogger } = require('../services/logger');

const logger = createLogger('AuthController');

class AuthController {
  constructor(fastify) {
    this.db = getDatabaseService().getPrisma();
    this.redis = new RedisService(fastify);
  }
  
  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(request, reply) {
    try {
      const { email, password, name, role } = request.body;
      
      logger.info('Tentative d\'inscription', { email });
      
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this.db.user.findUnique({
        where: { email }
      });
      
      if (existingUser) {
        logger.warn('Tentative d\'inscription avec email existant', { email });
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Un utilisateur avec cet email existe déjà'
        });
      }
      
      // Hacher le mot de passe
      const hashedPassword = await HashService.hashPassword(password);
      
      // Créer l'utilisateur
      const user = await this.db.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: role || 'USER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      });
      
      // Générer le token JWT
      const token = JWTService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Mettre en cache les informations utilisateur
      await this.redis.set(`user:${user.id}`, user, 3600); // 1 heure
      
      logger.info('Inscription réussie', { userId: user.id, email });
      
      return reply.code(201).send({
        message: 'Inscription réussie',
        user,
        token
      });
      
    } catch (error) {
      logger.error('Erreur lors de l\'inscription', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Connexion d'un utilisateur
   */
  async login(request, reply) {
    try {
      const { email, password } = request.body;
      
      logger.info('Tentative de connexion', { email });
      
      // Trouver l'utilisateur
      const user = await this.db.user.findUnique({
        where: { email }
      });
      
      if (!user) {
        logger.warn('Tentative de connexion avec email inexistant', { email });
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Email ou mot de passe incorrect'
        });
      }
      
      // Vérifier le mot de passe
      const isPasswordValid = await HashService.verifyPassword(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn('Tentative de connexion avec mot de passe incorrect', { email });
        return reply.code(401).send({
          error: 'Unauthorized',
          message: 'Email ou mot de passe incorrect'
        });
      }
      
      // Générer le token JWT
      const token = JWTService.generateToken({
        id: user.id,
        email: user.email,
        role: user.role
      });
      
      // Préparer les données utilisateur (sans mot de passe)
      const userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt
      };
      
      // Mettre en cache les informations utilisateur
      await this.redis.set(`user:${user.id}`, userData, 3600); // 1 heure
      
      logger.info('Connexion réussie', { userId: user.id, email });
      
      return reply.send({
        message: 'Connexion réussie',
        user: userData,
        token
      });
      
    } catch (error) {
      logger.error('Erreur lors de la connexion', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Récupération du profil utilisateur
   */
  async getProfile(request, reply) {
    try {
      const userId = request.user.id;
      
      logger.debug('Récupération du profil', { userId });
      
      // Essayer de récupérer depuis le cache
      let user = await this.redis.get(`user:${userId}`);
      
      if (!user) {
        // Si pas en cache, récupérer depuis la base
        user = await this.db.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            createdAt: true,
            updatedAt: true
          }
        });
        
        if (!user) {
          return reply.code(404).send({
            error: 'Not Found',
            message: 'Utilisateur non trouvé'
          });
        }
        
        // Mettre en cache
        await this.redis.set(`user:${userId}`, user, 3600);
      }
      
      logger.debug('Profil récupéré', { userId });
      
      return reply.send({
        user
      });
      
    } catch (error) {
      logger.error('Erreur lors de la récupération du profil', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Mise à jour du profil utilisateur
   */
  async updateProfile(request, reply) {
    try {
      const userId = request.user.id;
      const updateData = request.body;
      
      logger.info('Mise à jour du profil', { userId, updateData });
      
      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      if (updateData.email) {
        const existingUser = await this.db.user.findFirst({
          where: {
            email: updateData.email,
            NOT: { id: userId }
          }
        });
        
        if (existingUser) {
          return reply.code(409).send({
            error: 'Conflict',
            message: 'Cet email est déjà utilisé'
          });
        }
      }
      
      // Mettre à jour l'utilisateur
      const user = await this.db.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      // Mettre à jour le cache
      await this.redis.set(`user:${userId}`, user, 3600);
      
      logger.info('Profil mis à jour', { userId });
      
      return reply.send({
        message: 'Profil mis à jour avec succès',
        user
      });
      
    } catch (error) {
      logger.error('Erreur lors de la mise à jour du profil', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Changement de mot de passe
   */
  async changePassword(request, reply) {
    try {
      const userId = request.user.id;
      const { currentPassword, newPassword } = request.body;
      
      logger.info('Changement de mot de passe', { userId });
      
      // Récupérer l'utilisateur avec son mot de passe
      const user = await this.db.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Utilisateur non trouvé'
        });
      }
      
      // Vérifier le mot de passe actuel
      const isCurrentPasswordValid = await HashService.verifyPassword(currentPassword, user.password);
      
      if (!isCurrentPasswordValid) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Mot de passe actuel incorrect'
        });
      }
      
      // Hacher le nouveau mot de passe
      const hashedNewPassword = await HashService.hashPassword(newPassword);
      
      // Mettre à jour le mot de passe
      await this.db.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword }
      });
      
      logger.info('Mot de passe changé', { userId });
      
      return reply.send({
        message: 'Mot de passe changé avec succès'
      });
      
    } catch (error) {
      logger.error('Erreur lors du changement de mot de passe', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Déconnexion (invalidation du token en cache)
   */
  async logout(request, reply) {
    try {
      const userId = request.user.id;
      
      logger.info('Déconnexion', { userId });
      
      // Supprimer les données utilisateur du cache
      await this.redis.del(`user:${userId}`);
      
      logger.info('Déconnexion réussie', { userId });
      
      return reply.send({
        message: 'Déconnexion réussie'
      });
      
    } catch (error) {
      logger.error('Erreur lors de la déconnexion', { error: error.message });
      throw error;
    }
  }
}

module.exports = AuthController;