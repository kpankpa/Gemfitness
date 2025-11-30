import winston from 'winston';
import path from 'path';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  })
);

// Create logs directory path
const logsDir = path.join(process.cwd(), 'logs');

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'gemfitness' },
  transports: [
    // Write all logs to console in development
    new winston.transports.Console({
      format: consoleFormat,
    }),
    // Write all logs with level 'error' or higher to error.log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If we're not in production, log to the console with colorization
if (process.env.NODE_ENV !== 'production') {
  logger.level = 'debug';
}

// Helper functions for common logging patterns
export const logAuth = (action: string, userId: string, meta?: Record<string, unknown>) => {
  logger.info(`AUTH: ${action}`, { userId, ...meta });
};

export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error('Error occurred', {
    message: error.message,
    stack: error.stack,
    ...context,
  });
};

export const logActivity = (action: string, userId: string, meta?: Record<string, unknown>) => {
  logger.info(`ACTIVITY: ${action}`, { userId, ...meta });
};

export const logPayment = (action: string, userId: string, amount: number, meta?: Record<string, unknown>) => {
  logger.info(`PAYMENT: ${action}`, { userId, amount, ...meta });
};

export const logCheckIn = (userId: string, meta?: Record<string, unknown>) => {
  logger.info('CHECK-IN', { userId, ...meta });
};

export default logger;
