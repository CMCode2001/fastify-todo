const winston = require('winston');
const config = require('../config');

// Configuration des niveaux de log personnalisés
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(logColors);

// Format personnalisé pour les logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuration des transports
const transports = [
  // Console transport pour le développement
  new winston.transports.Console({
    format: logFormat
  }),
  
  // File transport pour les erreurs
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }),
  
  // File transport pour tous les logs
  new winston.transports.File({
    filename: config.logging.file,
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  })
];

// Création du logger
const logger = winston.createLogger({
  level: config.logging.level,
  levels: logLevels,
  transports
});

// Fonction pour créer un sous-logger avec un contexte
function createLogger(context) {
  return {
    error: (message, meta = {}) => logger.error(`[${context}] ${message}`, meta),
    warn: (message, meta = {}) => logger.warn(`[${context}] ${message}`, meta),
    info: (message, meta = {}) => logger.info(`[${context}] ${message}`, meta),
    http: (message, meta = {}) => logger.http(`[${context}] ${message}`, meta),
    debug: (message, meta = {}) => logger.debug(`[${context}] ${message}`, meta)
  };
}

module.exports = {
  logger,
  createLogger
};