import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database';
import { getSession } from '../config/redis';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    mmda_id?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env['JWT_SECRET'] || 'your-secret-key';

    // Verify JWT token
    const decoded = jwt.verify(token, secret) as any;
    
    if (!decoded || !decoded.id) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
      return;
    }

    // Check if user exists and is active
    const user = await db('users')
      .select('id', 'email', 'role', 'status', 'mmda_id')
      .where('id', decoded.id)
      .first();

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (user.status !== 'active') {
      res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
      return;
    }

    // Check session in Redis (optional for development)
    try {
      const session = await getSession(decoded.id);
      if (session === null) {
        // Redis is disabled, skip session check
        logger.info('Redis is disabled, skipping session check');
      } else if (!session) {
        res.status(401).json({
          success: false,
          message: 'Session expired'
        });
        return;
      }
    } catch (error) {
      // If Redis is not available, skip session check for development
      logger.warn('Redis session check failed, skipping for development:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      mmda_id: user.mmda_id
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const requireMMDA = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
    return;
  }

  if (!req.user.mmda_id) {
    res.status(403).json({
      success: false,
      message: 'MMDA access required'
    });
    return;
  }

  next();
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const secret = process.env['JWT_SECRET'] || 'your-secret-key';

    const decoded = jwt.verify(token, secret) as any;
    
    if (!decoded || !decoded.id) {
      next();
      return;
    }

    const user = await db('users')
      .select('id', 'email', 'role', 'status', 'mmda_id')
      .where('id', decoded.id)
      .where('status', 'active')
      .first();

    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        mmda_id: user.mmda_id
      };
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};
