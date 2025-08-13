import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';

interface CustomError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || 'INTERNAL_ERROR';

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Error handler middleware
export const errorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let { statusCode = 500, message } = error;

  // Log the error
  logError(error, {
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid data format';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    if ((error as any).code === 11000) {
      statusCode = 409;
      message = 'Duplicate entry';
    } else {
      statusCode = 500;
      message = 'Database error';
    }
  } else if (error.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Validation failed';
  } else if (error.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Invalid reference';
  }

  // Handle Knex errors
  if (error.message?.includes('duplicate key')) {
    statusCode = 409;
    message = 'Duplicate entry';
  } else if (error.message?.includes('foreign key')) {
    statusCode = 400;
    message = 'Invalid reference';
  } else if (error.message?.includes('not null')) {
    statusCode = 400;
    message = 'Required field missing';
  }

  // Handle network errors
  if (error.message?.includes('ECONNREFUSED')) {
    statusCode = 503;
    message = 'Service temporarily unavailable';
  } else if (error.message?.includes('ETIMEDOUT')) {
    statusCode = 504;
    message = 'Request timeout';
  }

  // Determine if we should expose the error message
  const isDevelopment = process.env['NODE_ENV'] === 'development';
  const isOperational = error.isOperational !== false;

  // Don't expose internal errors in production
  if (!isDevelopment && !isOperational) {
    message = 'Internal server error';
  }

  // Send error response
  const errorResponse: any = {
    success: false,
    message,
    code: error.code || 'INTERNAL_ERROR'
  };

  // Add stack trace in development
  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.details = {
      name: error.name,
      message: error.message,
      statusCode: error.statusCode
    };
  }

  // Add request ID if available
  if ((req as any).id) {
    errorResponse.requestId = (req as any).id;
  }

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  res.status(404).json({
    success: false,
    message: error.message,
    code: error.code
  });
};

// Graceful shutdown handler
export const gracefulShutdown = (server: any) => {
  return (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  };
};

// Global error handlers
process.on('uncaughtException', (error: Error) => {
  logError(error, { type: 'uncaughtException' });
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  logError(new Error(String(reason)), { type: 'unhandledRejection', promise });
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Request timeout handler
export const timeoutHandler = (timeout: number = 30000) => {
  return (_req: Request, res: Response, next: NextFunction) => {
    const timer = setTimeout(() => {
      const error = new AppError('Request timeout', 408, 'TIMEOUT_ERROR');
      next(error);
    }, timeout);

    res.on('finish', () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Rate limiting error handler
export const rateLimitErrorHandler = (_req: Request, _res: Response, next: NextFunction) => {
  const error = new RateLimitError('Too many requests from this IP');
  next(error);
};

// Database connection error handler
export const databaseErrorHandler = (error: Error) => {
  logError(error, { type: 'database_error' });
  logger.error('Database connection error:', error);
  
  // Attempt to reconnect after delay
  setTimeout(() => {
    logger.info('Attempting to reconnect to database...');
    // Add your database reconnection logic here
  }, 5000);
};
