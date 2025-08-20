import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
// import slowDown from 'express-slow-down';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import revenueRoutes from './routes/revenue';
import paymentRoutes from './routes/payments';
import reportRoutes from './routes/reports';
import notificationRoutes from './routes/notifications';
import adminRoutes from './routes/admin';

// Import middleware
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env['PORT'] || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env['CLIENT_URL'] || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased from 500)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// More permissive rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // allow more requests for authentication
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// const speedLimiter = slowDown({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   delayAfter: 50, // allow 50 requests per 15 minutes, then...
//   delayMs: 500 // begin adding 500ms of delay per request above 50
// });

app.use(limiter);
// app.use(speedLimiter);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the React build directory (for production)
if (process.env['NODE_ENV'] === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/build')));
}

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env['NODE_ENV'] || 'development'
  });
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/revenue', authMiddleware, revenueRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/notifications', authMiddleware, notificationRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

// WebSocket connection for real-time updates
io.on('connection', (socket: any) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-room', (room: any) => {
    socket.join(room);
    logger.info(`Client ${socket.id} joined room: ${room}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(errorHandler);

// Serve React app for client-side routing (must be after API routes)
if (process.env['NODE_ENV'] === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/build/index.html'));
  });
} else {
  // 404 handler for development
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      path: req.originalUrl
    });
  });
}

// Initialize database and start server
async function startServer() {
  try {
    // Connect to database (optional for development)
    try {
      await connectDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown database error';
      logger.warn('Database connection failed, running without database:', errorMessage);
      // The connectDatabase function will automatically fall back to mock database
    }

    // Connect to Redis (optional for development)
    try {
      await connectRedis();
      logger.info('Redis connected successfully');
    } catch (redisError) {
      const errorMessage = redisError instanceof Error ? redisError.message : 'Unknown Redis error';
      logger.warn('Redis connection failed, running without Redis:', errorMessage);
    }

    // Start server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env['NODE_ENV'] || 'development'}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export { app, io };
