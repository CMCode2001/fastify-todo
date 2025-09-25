/**
 * Middleware de gestion d'erreurs globales
 */
function errorHandler(error, request, reply) {
  request.log.error(error);
  
  // Erreurs Prisma
  if (error.code === 'P2002') {
    return reply.code(409).send({
      error: 'Conflict',
      message: 'Cette ressource existe déjà'
    });
  }
  
  if (error.code === 'P2025') {
    return reply.code(404).send({
      error: 'Not Found',
      message: 'Ressource non trouvée'
    });
  }
  
  // Erreurs de validation Fastify
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation Error',
      message: 'Données invalides',
      details: error.validation
    });
  }
  
  // Erreurs de syntaxe JSON
  if (error.type === 'entity.parse.failed') {
    return reply.code(400).send({
      error: 'Bad Request',
      message: 'Format JSON invalide'
    });
  }
  
  // Erreur par défaut
  const statusCode = error.statusCode || 500;
  const message = statusCode === 500 
    ? 'Erreur interne du serveur' 
    : error.message || 'Une erreur est survenue';
  
  return reply.code(statusCode).send({
    error: error.name || 'Error',
    message: message
  });
}

/**
 * Middleware de gestion des routes non trouvées
 */
function notFoundHandler(request, reply) {
  return reply.code(404).send({
    error: 'Not Found',
    message: `Route ${request.method} ${request.url} non trouvée`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};