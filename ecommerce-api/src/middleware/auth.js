const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Middleware d'authentification JWT
 * Vérifie la présence et la validité du token JWT
 */
async function authenticate(request, reply) {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token d\'authentification manquant'
      });
    }
    
    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      request.user = decoded;
    } catch (jwtError) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Token d\'authentification invalide'
      });
    }
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Erreur lors de l\'authentification'
    });
  }
}

/**
 * Middleware d'autorisation par rôle
 * Vérifie que l'utilisateur a le rôle requis
 */
function authorize(roles = []) {
  return async function(request, reply) {
    if (!request.user) {
      return reply.code(401).send({
        error: 'Unauthorized',
        message: 'Authentification requise'
      });
    }
    
    if (roles.length && !roles.includes(request.user.role)) {
      return reply.code(403).send({
        error: 'Forbidden',
        message: 'Permissions insuffisantes'
      });
    }
  };
}

module.exports = {
  authenticate,
  authorize
};