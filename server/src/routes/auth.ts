import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { setSession, deleteSession } from '../config/redis';
import { logger, logUserAction, logSecurity } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { sendSMS } from '../utils/sms';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Determine once per process whether a real DB is configured
const useRealDatabase = true; // Prisma is always used for now

// Validation middleware (kept for reference, not used)
// const validateRegistration = [
//   body('email').isEmail().normalizeEmail(),
//   body('phone').isMobilePhone('en-GH'),
//   body('password').isLength({ min: 8 }),
//   body('first_name').trim().isLength({ min: 2 }),
//   body('last_name').trim().isLength({ min: 2 }),
//   body('ghana_card_number').optional().isLength({ min: 10 }),
// ];

// Custom registration validation to avoid env-specific validator issues
const customValidateRegistration = (req: Request, res: Response, next: Function) => {
  const { email, phone, password, first_name, last_name } = req.body || {};

  const errors: Array<{ param: string; msg: string }> = [];

  const emailStr = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!emailStr || !emailStr.includes('@') || !emailStr.includes('.')) {
    errors.push({ param: 'email', msg: 'Please provide a valid email address' });
  }

  const phoneStr = typeof phone === 'string' ? phone.replace(/\s+/g, '') : '';
  if (!phoneStr || !/^\+?\d{9,15}$/.test(phoneStr)) {
    errors.push({ param: 'phone', msg: 'Please provide a valid phone number' });
  }

  const passwordStr = typeof password === 'string' ? password : '';
  if (!passwordStr || passwordStr.length < 8) {
    errors.push({ param: 'password', msg: 'Password must be at least 8 characters' });
  }

  const firstNameStr = typeof first_name === 'string' ? first_name.trim() : '';
  const lastNameStr = typeof last_name === 'string' ? last_name.trim() : '';
  if (!firstNameStr || firstNameStr.length < 2) {
    errors.push({ param: 'first_name', msg: 'First name must be at least 2 characters' });
  }
  if (!lastNameStr || lastNameStr.length < 2) {
    errors.push({ param: 'last_name', msg: 'Last name must be at least 2 characters' });
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }
  next();
  return;
};

// Custom validation function to bypass express-validator issues
const customValidateLogin = (req: Request, res: Response, next: Function) => {
  const { email, password } = req.body;
  
  const errors: any[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push({ param: 'email', msg: 'Email is required' });
  } else if (!email.includes('@') || !email.includes('.')) {
    errors.push({ param: 'email', msg: 'Please provide a valid email address' });
  }
  
  if (!password || typeof password !== 'string') {
    errors.push({ param: 'password', msg: 'Password is required' });
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors
    });
  }
  
  next();
  return;
};

// validateLogin commented out - using customValidateLogin instead
// const validateLogin = [
//   body('email')
//     .trim()
//     .isEmail()
//     .withMessage('Please provide a valid email address')
//     .normalizeEmail(),
//   body('password')
//     .trim()
//     .notEmpty()
//     .withMessage('Password is required'),
// ];

const validatePasswordReset = [
  body('email').isEmail().normalizeEmail(),
];

// Password change validation (commented out as it's not currently used)
// const validatePasswordChange = [
//   body('current_password').notEmpty(),
//   body('new_password').isLength({ min: 8 }),
// ];

// Register new user
router.post('/register', customValidateRegistration, async (req: Request, res: Response) => {
  try {
    const {
      email: rawEmail,
      phone: rawPhone,
      password,
      first_name,
      last_name,
      middle_name,
      ghana_card_number,
      date_of_birth,
      gender,
      address,
      city,
      region,
      postal_code
    } = req.body;

    const email = String(rawEmail || '').trim().toLowerCase();
    const phone = String(rawPhone || '').replace(/\s+/g, '');

    // Check if user already exists
    let existingUser;
    if (useRealDatabase) {
      try {
        existingUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: email },
              { phone: phone }
            ]
          }
        });
      } catch (dbError) {
        logger.warn('Database query failed, using mock database:', dbError);
        // Mock database logic would go here if needed
      }
    } else {
      // Mock database logic would go here if needed
    }

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user with role based on email domain
    let user;
    if (useRealDatabase) {
      try {
        // Determine role based on email domain
        let userRole = 'taxpayer'; // default role
        if (email.endsWith('@admin.com')) {
          userRole = 'admin';
        } else if (email.endsWith('@staff.com')) {
          userRole = 'staff';
        }
        // All other domains (including @gmail.com) get 'taxpayer' role

        user = await prisma.user.create({
          data: {
            email,
            phone,
            password_hash: passwordHash,
            first_name,
            last_name,
            middle_name,
            ghana_card_number,
            date_of_birth,
            gender,
            address,
            city,
            region,
            postal_code,
            role: userRole,
            status: 'pending'
          },
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            role: true,
            status: true
          }
        });
      } catch (dbError) {
        logger.warn('Database insert failed, using mock database:', dbError);
        // Mock database logic would go here if needed
        return res.status(500).json({
          success: false,
          message: 'Failed to create user in database'
        });
      }
    } else {
      // Mock database logic would go here if needed
      return res.status(500).json({
        success: false,
        message: 'Mock database not implemented'
      });
    }

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    // Best-effort notifications: do not fail registration if email/SMS fails
    await Promise.allSettled([
      sendEmail({
        to: email,
        subject: 'Welcome to MMDA Revenue System',
        template: 'welcome',
        data: {
          name: `${first_name} ${last_name}`,
          verificationUrl: `${process.env['CLIENT_URL']}/verify-email?token=${user.id}`
        }
      }),
      sendSMS({
        to: phone,
        message: 'Welcome to MMDA Revenue System. Your account has been created successfully. Please verify your email to activate your account.'
      })
    ]);

    logUserAction(String(user.id), 'user_registered', { email, phone });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email for verification.',
      data: {
        id: user.id,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
});

// Login user
router.post('/login', customValidateLogin, async (req: Request, res: Response) => {
  try {
    // Debug: Log the request body
    logger.info('Login request body:', JSON.stringify(req.body));
    logger.info('Login request headers:', JSON.stringify(req.headers));
    
    // Check if validation middleware ran
    if (!req.body || Object.keys(req.body).length === 0) {
      logger.error('Request body is empty or undefined');
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.error('Login validation failed. Errors:');
      logger.error('Raw validation errors:', JSON.stringify(errors.array()));
      errors.array().forEach((error: any) => {
        logger.error(`- ${error.param || 'unknown'}: ${error.msg || 'Invalid value'}`);
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    logger.info('Login attempt for email:', email);

    // Find user
    let user;
    if (useRealDatabase) {
      try {
        user = await prisma.user.findFirst({
          where: {
            email: email
          }
        });
      } catch (dbError) {
        logger.warn('Database query failed, using mock database:', dbError);
        // Mock database logic would go here if needed
      }
    } else {
      // Mock database logic would go here if needed
    }

    if (!user) {
      logSecurity('failed_login_attempt', undefined, { email, reason: 'user_not_found' });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed login attempts'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      // Increment login attempts
      const loginAttempts = (user.login_attempts || 0) + 1;
      const maxAttempts = 5;
      
      if (loginAttempts >= maxAttempts) {
        const lockUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        // Update login attempts and lock if necessary
        if (useRealDatabase) {
          try {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                login_attempts: loginAttempts,
                locked_until: lockUntil
              }
            });
          } catch (dbError) {
            logger.warn('Database update failed, using mock database:', dbError);
            // Mock database logic would go here if needed
          }
        } else {
          // Mock database logic would go here if needed
        }
        
        logSecurity('failed_login_attempt', String(user.id), { email, reason: 'account_locked', attempts: loginAttempts });
        
        return res.status(403).json({
          success: false,
          message: 'Account locked due to too many failed attempts. Please try again later or reset your password.'
        });
      }

      // Update login attempts
      if (useRealDatabase) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: { login_attempts: loginAttempts }
          });
        } catch (dbError) {
          logger.warn('Database update failed, using mock database:', dbError);
          // Mock database logic would go here if needed
        }
      } else {
        // Mock database logic would go here if needed
      }
      
      logSecurity('failed_login_attempt', String(user.id), { email, reason: 'invalid_password', attempts: loginAttempts });
      
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts and update last login
    if (useRealDatabase) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            login_attempts: 0,
            locked_until: null,
            last_login_at: new Date(),
            last_login_ip: req.ip || null
          }
        });
      } catch (dbError) {
        logger.warn('Database update failed, using mock database:', dbError);
        // Mock database logic would go here if needed
      }
    } else {
      // Mock database logic would go here if needed
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please verify your email or contact support.'
      });
    }

    // Generate JWT token
    const secret = process.env['JWT_SECRET'] || 'your-secret-key';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: '24h' }
    );

    // Store session in Redis
    await setSession(String(user.id), {
      id: user.id,
      email: user.email,
      role: user.role,
      mmda_id: user.mmda_id,
      lastActivity: new Date().toISOString()
    });

    logUserAction(String(user.id), 'user_login', { email, ip: req.ip });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          status: user.status,
          mmda_id: user.mmda_id
        }
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
});

// Logout user
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env['JWT_SECRET'] || 'your-secret-key';
      
      try {
        const decoded = jwt.verify(token, secret) as any;
        if (decoded && decoded.id) {
          await deleteSession(String(decoded.id));
          logUserAction(String(decoded.id), 'user_logout');
        }
      } catch (error) {
        // Token is invalid, but we still return success
      }
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// Request password reset
router.post('/forgot-password', validatePasswordReset, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Try real database first, fall back to mock
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          email: email
        }
      });
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      // Mock database logic would go here if needed
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: user.id, type: 'password_reset' },
      process.env['JWT_SECRET'] || 'your-secret-key',
      { expiresIn: '1h' }
    );

    // Store reset token in Redis
    await setSession(`reset_${user.id}`, { token: resetToken }, 3600); // 1 hour

    // Send reset email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      template: 'password_reset',
      data: {
        name: `${user.first_name} ${user.last_name}`,
        resetUrl: `${process.env['CLIENT_URL']}/reset-password?token=${resetToken}`
      }
    });

    logUserAction(String(user.id), 'password_reset_requested', { email });

    return res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });
  } catch (error) {
    logger.error('Password reset request error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset request failed'
    });
  }
});

// Reset password
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password || new_password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token or password'
      });
    }

    const secret = process.env['JWT_SECRET'] || 'your-secret-key';
    
    try {
      const decoded = jwt.verify(token, secret) as any;
      
      if (!decoded || decoded.type !== 'password_reset') {
        return res.status(400).json({
          success: false,
          message: 'Invalid reset token'
        });
      }

      // Try real database first, fall back to mock
      let user;
      try {
        user = await prisma.user.findFirst({
          where: {
            id: decoded.id
          }
        });
      } catch (dbError) {
        logger.warn('Database query failed, using mock database:', dbError);
        // Mock database logic would go here if needed
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(new_password, saltRounds);

      // Update password
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            password_hash: passwordHash,
            login_attempts: 0,
            locked_until: null
          }
        });
      } catch (dbError) {
        logger.warn('Database update failed, using mock database:', dbError);
        // Mock database logic would go here if needed
      }

      // Delete reset token
      await deleteSession(`reset_${user.id}`);

      logUserAction(String(user.id), 'password_reset_completed', { email: user.email });

      return res.json({
        success: true,
        message: 'Password reset successful'
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
  } catch (error) {
    logger.error('Password reset error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed'
    });
  }
});

// Verify email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Verification token required'
      });
    }

    // Try real database first, fall back to mock
    let user;
    try {
      user = await prisma.user.findFirst({
        where: {
          id: token
        }
      });
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      // Mock database logic would go here if needed
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    if (user.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    // Update user status
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          email_verified: true,
          email_verified_at: new Date(),
          status: 'active'
        }
      });
    } catch (dbError) {
      logger.warn('Database update failed, using mock database:', dbError);
      // Mock database logic would go here if needed
    }

    logUserAction(String(user.id), 'email_verified', { email: user.email });

    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification failed'
    });
  }
});

// Get current user profile
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7);
    const secret = process.env['JWT_SECRET'] || 'your-secret-key';
    
    const decoded = jwt.verify(token, secret) as any;
    
    // Try real database first, fall back to mock
    let user;
    try {
      user = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          phone: true,
          first_name: true,
          last_name: true,
          middle_name: true,
          role: true,
          status: true,
          mmda_id: true,
          profile_image_url: true,
          email_verified: true,
          phone_verified: true,
          created_at: true
        },
        where: {
          id: decoded.id
        }
      });
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      // Mock database logic would go here if needed
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

// Taxpayer-specific routes
// Get taxpayer dashboard data
router.get('/taxpayer/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account not active. Please verify your email.'
      });
    }

    // Get taxpayer's assessments and payments
    const assessments = await prisma.assessment.findMany({
      where: { user_id: userId },
      include: {
        property: true,
        revenue_category: true,
        payments: true
      },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    // Calculate summary
    const totalAssessments = assessments.length;
    const totalAmount = assessments.reduce((sum, assessment) => sum + assessment.amount, 0);
    const paidAmount = assessments.reduce((sum, assessment) => {
      const paidPayments = assessment.payments.filter(payment => payment.status === 'completed');
      return sum + paidPayments.reduce((pSum, payment) => pSum + payment.amount, 0);
    }, 0);
    const pendingAmount = totalAmount - paidAmount;

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalAssessments,
          totalAmount,
          paidAmount,
          pendingAmount
        },
        recentAssessments: assessments
      }
    });
  } catch (error) {
    logger.error('Taxpayer dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load dashboard data'
    });
  }
});

// Get taxpayer's payment history
router.get('/taxpayer/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    // Get all assessments and payments
    const assessments = await prisma.assessment.findMany({
      where: { user_id: userId },
      include: {
        property: true,
        revenue_category: true,
        payments: {
          orderBy: { created_at: 'desc' }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: assessments
    });
  } catch (error) {
    logger.error('Taxpayer history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load payment history'
    });
  }
});

// Submit a report
router.post('/taxpayer/report', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, content, type } = req.body;

    if (!title || !content || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title, content, and type are required'
      });
    }

    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    // Create report
    const report = await prisma.report.create({
      data: {
        user_id: userId,
        title,
        content,
        type,
        status: 'pending'
      }
    });

    logUserAction(String(userId), 'report_submitted', { title, type });

    return res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      data: report
    });
  } catch (error) {
    logger.error('Report submission error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit report'
    });
  }
});

// Get taxpayer's reports
router.get('/taxpayer/reports', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    // Get user's reports
    const reports = await prisma.report.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json({
      success: true,
      data: reports
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load reports'
    });
  }
});

// Revenue management - view revenue categories and rates
router.get('/taxpayer/revenue-categories', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true, mmda_id: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    // Get revenue categories for user's MMDA
    let revenueCategories: Array<{
      id: number;
      name: string;
      description: string | null;
      rate: number;
      mmda_id: number;
      created_at: Date;
      updated_at: Date;
    }> = [];
    if (user.mmda_id) {
      revenueCategories = await prisma.revenueCategory.findMany({
        where: { mmda_id: user.mmda_id },
        orderBy: { name: 'asc' }
      });
    }

    return res.status(200).json({
      success: true,
      data: revenueCategories
    });
  } catch (error) {
    logger.error('Revenue categories error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load revenue categories'
    });
  }
});

// Tax payment route for taxpayers
router.post('/taxpayer/pay-tax', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { assessment_id, amount, payment_method } = req.body;

    if (!assessment_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Assessment ID, amount, and payment method are required'
      });
    }

    // Verify user is a taxpayer
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'taxpayer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Taxpayer role required.'
      });
    }

    // Verify the assessment belongs to this user
    const assessment = await prisma.assessment.findFirst({
      where: { 
        id: parseInt(assessment_id),
        user_id: userId 
      }
    });

    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: 'Assessment not found'
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        assessment_id: parseInt(assessment_id),
        amount: parseFloat(amount),
        payment_method,
        status: 'pending',
        user_id: userId,
        payment_reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }
    });

    logUserAction(String(userId), 'tax_payment_made', { 
      assessment_id, 
      amount, 
      payment_method,
      payment_id: payment.id 
    });

    return res.status(201).json({
      success: true,
      message: 'Tax payment recorded successfully',
      data: payment
    });
  } catch (error) {
    logger.error('Tax payment error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process tax payment'
    });
  }
});

// Admin stats endpoint (what frontend expects)
router.get('/admin/stats', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is an admin
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Calculate total revenue from completed payments
    const totalRevenue = await prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });

    // Calculate pending payments
    const pendingPayments = await prisma.payment.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true }
    });

    // Get system statistics
    const totalUsers = await prisma.user.count();
    const totalTaxpayers = await prisma.user.count({ where: { role: 'taxpayer' } });
    const totalStaff = await prisma.user.count({ where: { role: 'staff' } });
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const totalAssessments = await prisma.assessment.count();
    const totalPayments = await prisma.payment.count();
    const totalProperties = await prisma.property.count();

    return res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingPayments: pendingPayments._sum.amount || 0,
        activeUsers,
        totalProperties,
        totalUsers,
        totalTaxpayers,
        totalStaff,
        totalAssessments,
        totalPayments
      }
    });
  } catch (error) {
    logger.error('Admin stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin statistics'
    });
  }
});

// Admin dashboard route
router.get('/admin/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is an admin
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.'
      });
    }

    // Get system statistics
    const totalUsers = await prisma.user.count();
    const totalTaxpayers = await prisma.user.count({ where: { role: 'taxpayer' } });
    const totalStaff = await prisma.user.count({ where: { role: 'staff' } });
    const totalAssessments = await prisma.assessment.count();
    const totalPayments = await prisma.payment.count();

    return res.status(200).json({
      success: true,
      message: 'Admin Dashboard',
      data: {
        dashboard: 'Admin Dashboard',
        summary: {
          totalUsers,
          totalTaxpayers,
          totalStaff,
          totalAssessments,
          totalPayments
        },
        user: {
          id: userId,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard'
    });
  }
});

// Staff dashboard route
router.get('/staff/dashboard', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Verify user is staff
    const user = await prisma.user.findFirst({
      where: { id: userId },
      select: { role: true, status: true }
    });

    if (!user || user.role !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Staff role required.'
      });
    }

    // Get staff-specific data
    const pendingReports = await prisma.report.count({ where: { status: 'pending' } });
    const totalTaxpayers = await prisma.user.count({ where: { role: 'taxpayer' } });
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const recentAssessments = await prisma.assessment.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { first_name: true, last_name: true, email: true } },
        property: { select: { property_number: true, address: true } }
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Staff Dashboard',
      data: {
        dashboard: 'Staff Dashboard',
        summary: {
          pendingReports,
          totalTaxpayers,
          activeUsers,
          recentAssessments: recentAssessments.length
        },
        recentAssessments,
        user: {
          id: userId,
          role: user.role,
          status: user.status
        }
      }
    });
  } catch (error) {
    logger.error('Staff dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load staff dashboard'
    });
  }
});

export default router;
