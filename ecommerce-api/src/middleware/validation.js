/**
 * Middleware de validation des données entrantes
 * Utilise Joi pour valider les schémas
 */
function validateSchema(schema, source = 'body') {
  return async function(request, reply) {
    try {
      let dataToValidate;
      
      switch (source) {
        case 'body':
          dataToValidate = request.body;
          break;
        case 'query':
          dataToValidate = request.query;
          break;
        case 'params':
          dataToValidate = request.params;
          break;
        default:
          dataToValidate = request.body;
      }
      
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false,
        stripUnknown: true
      });
      
      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        
        return reply.code(400).send({
          error: 'Validation Error',
          message: 'Données invalides',
          details: validationErrors
        });
      }
      
      // Replace the original data with validated and sanitized data
      switch (source) {
        case 'body':
          request.body = value;
          break;
        case 'query':
          request.query = value;
          break;
        case 'params':
          request.params = value;
          break;
      }
      
    } catch (error) {
      request.log.error(error);
      return reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Erreur lors de la validation'
      });
    }
  };
}

module.exports = {
  validateSchema
};