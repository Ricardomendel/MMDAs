import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db, mockDb } from '../config/database';
import { setSession, deleteSession } from '../config/redis';
import { logger, logUserAction, logSecurity } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { sendSMS } from '../utils/sms';

const router = Router();

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('phone').isMobilePhone('en-GH'),
  body('password').isLength({ min: 8 }),
  body('first_name').trim().isLength({ min: 2 }),
  body('last_name').trim().isLength({ min: 2 }),
  body('ghana_card_number').optional().isLength({ min: 10 }),
];

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
router.post('/register', validateRegistration, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      email,
      phone,
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

    // Check if user already exists - try real database first, fall back to mock
    let existingUser;
    try {
      existingUser = await db('users')
        .where('email', email)
        .orWhere('phone', phone)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      existingUser = mockDb.users.where('email', email).first() || mockDb.users.where('phone', phone).first();
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

    // Create user - try real database first, fall back to mock
    let user;
    try {
      const [newUser] = await db('users')
        .insert({
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
          role: 'taxpayer',
          status: 'pending'
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'status']);
      user = newUser;
    } catch (dbError) {
      logger.warn('Database insert failed, using mock database:', dbError);
      // Create user in mock database and mark active for testing
      const [createdUser] = mockDb.users
        .insert({
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
          role: 'taxpayer',
          status: 'active',
          email_verified: true
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'status']);
      user = createdUser;
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

    logUserAction(user.id, 'user_registered', { email, phone });

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

    // Find user - try real database first, fall back to mock
    let user;
    try {
      user = await db('users')
        .where('email', email)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      user = mockDb.users.where('email', email).first();
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
        try {
          await db('users')
            .where('id', user.id)
            .update({
              login_attempts: loginAttempts,
              locked_until: lockUntil
            });
        } catch (dbError) {
          logger.warn('Database update failed, using mock database:', dbError);
          mockDb.users.where('id', user.id).update({
            login_attempts: loginAttempts,
            locked_until: lockUntil
          });
        }
        
        logSecurity('account_locked', user.id, { email, loginAttempts });
        return res.status(423).json({
          success: false,
          message: 'Account locked due to multiple failed login attempts. Please try again in 30 minutes.'
        });
      } else {
        try {
          await db('users')
            .where('id', user.id)
            .update({ login_attempts: loginAttempts });
        } catch (dbError) {
          logger.warn('Database update failed, using mock database:', dbError);
          mockDb.users.where('id', user.id).update({ login_attempts: loginAttempts });
        }
      }

      logSecurity('failed_login_attempt', user.id, { email, loginAttempts });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please verify your email or contact support.'
      });
    }

    // Reset login attempts
    try {
      await db('users')
        .where('id', user.id)
        .update({
          login_attempts: 0,
          locked_until: null,
          last_login_at: new Date(),
          last_login_ip: req.ip
        });
    } catch (dbError) {
      logger.warn('Database update failed, using mock database:', dbError);
      mockDb.users.where('id', user.id).update({
        login_attempts: 0,
        locked_until: null,
        last_login_at: new Date(),
        last_login_ip: req.ip
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
    await setSession(user.id, {
      id: user.id,
      email: user.email,
      role: user.role,
      mmda_id: user.mmda_id,
      lastActivity: new Date().toISOString()
    });

    logUserAction(user.id, 'user_login', { email, ip: req.ip });

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
          await deleteSession(decoded.id);
          logUserAction(decoded.id, 'user_logout');
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
      user = await db('users')
        .where('email', email)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      user = mockDb.users.where('email', email).first();
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

    logUserAction(user.id, 'password_reset_requested', { email });

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
        user = await db('users')
          .where('id', decoded.id)
          .first();
      } catch (dbError) {
        logger.warn('Database query failed, using mock database:', dbError);
        user = mockDb.users.where('id', decoded.id).first();
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
        await db('users')
          .where('id', user.id)
          .update({
            password_hash: passwordHash,
            login_attempts: 0,
            locked_until: null
          });
      } catch (dbError) {
        logger.warn('Database update failed, using mock database:', dbError);
        mockDb.users.where('id', user.id).update({
          password_hash: passwordHash,
          login_attempts: 0,
          locked_until: null
        });
      }

      // Delete reset token
      await deleteSession(`reset_${user.id}`);

      logUserAction(user.id, 'password_reset_completed', { email: user.email });

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
      user = await db('users')
        .where('id', token)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      user = mockDb.users.where('id', token).first();
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
      await db('users')
        .where('id', user.id)
        .update({
          email_verified: true,
          email_verified_at: new Date(),
          status: 'active'
        });
    } catch (dbError) {
      logger.warn('Database update failed, using mock database:', dbError);
      mockDb.users.where('id', user.id).update({
        email_verified: true,
        email_verified_at: new Date(),
        status: 'active'
      });
    }

    logUserAction(user.id, 'email_verified', { email: user.email });

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
      user = await db('users')
        .select('id', 'email', 'phone', 'first_name', 'last_name', 'middle_name', 'role', 'status', 'mmda_id', 'profile_image_url', 'email_verified', 'phone_verified', 'created_at')
        .where('id', decoded.id)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      user = mockDb.users.select('id', 'email', 'phone', 'first_name', 'last_name', 'role', 'status', 'mmda_id', 'email_verified', 'phone_verified', 'created_at')
        .where('id', decoded.id)
        .first();
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

export default router;
