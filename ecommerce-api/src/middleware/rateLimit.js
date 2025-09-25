const rateLimit = require('@fastify/rate-limit');
const config = require('../config');

/**
 * Configuration du rate limiting
 */
const rateLimitOptions = {
  max: config.rateLimit.max,
  timeWindow: config.rateLimit.window,
  keyGenerator: (request) => {
    return request.user?.id || request.ip;
  },
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Too Many Requests',
      message: `Trop de requêtes. Limite: ${context.max} requêtes par ${context.timeWindow}`,
      retryAfter: Math.round(context.ttl / 1000)
    };
  }
};

/**
 * Rate limiting spécifique pour l'authentification
 */
const authRateLimitOptions = {
  max: 5,
  timeWindow: '15 minutes',
  keyGenerator: (request) => {
    return `auth_${request.ip}`;
  },
  errorResponseBuilder: (request, context) => {
    return {
      error: 'Too Many Authentication Attempts',
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      retryAfter: Math.round(context.ttl / 1000)
    };
  }
};

module.exports = {
  rateLimitOptions,
  authRateLimitOptions
};