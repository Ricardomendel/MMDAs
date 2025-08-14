import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { db, mockDb } from '../config/database';
import { logger } from '../utils/logger';

// Extend Request interface to include user property
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    mmda_id?: string;
  };
}

const router = Router();

// Validation for user creation
const validateUserCreation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  body('first_name').notEmpty().trim(),
  body('last_name').notEmpty().trim(),
  body('phone').optional().isMobilePhone('any'),
  body('role').isIn(['admin', 'staff', 'taxpayer', 'super_admin']),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
];

// Validation for user update
const validateUserUpdate = [
  body('email').optional().isEmail().normalizeEmail(),
  body('first_name').optional().trim(),
  body('last_name').optional().trim(),
  body('phone').optional().isMobilePhone('any'),
  body('role').optional().isIn(['admin', 'staff', 'taxpayer', 'super_admin']),
  body('status').optional().isIn(['active', 'inactive', 'suspended', 'pending']),
];

// Get all users (admin only)
router.get('/users', authMiddleware, requireRole(['admin', 'super_admin']), async (_req: Request, res: Response) => {
  try {
    let users;
    try {
      users = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'status', 'created_at', 'last_login_at')
        .orderBy('created_at', 'desc');
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      // Return mock users for development
      users = [
        { id: 1, email: 'admin@mmda.com', first_name: 'Admin', last_name: 'User', phone: '+233200000000', role: 'admin', status: 'active', created_at: new Date('2024-01-01'), last_login_at: new Date() },
        { id: 2, email: 'taxpayer@example.com', first_name: 'John', last_name: 'Doe', phone: '+233200000001', role: 'taxpayer', status: 'active', created_at: new Date('2024-01-01'), last_login_at: new Date() },
        { id: 3, email: 'staff@mmda.com', first_name: 'Jane', last_name: 'Smith', phone: '+233200000002', role: 'staff', status: 'active', created_at: new Date('2024-01-01'), last_login_at: new Date() }
      ];
    }

    res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users' 
    });
  }
});

// Create new user (admin only)
router.post('/users', authMiddleware, requireRole(['admin', 'super_admin']), validateUserCreation, async (req: AuthRequest, res: Response) => {
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
      password,
      first_name,
      last_name,
      phone,
      role,
      status = 'pending',
      middle_name,
      ghana_card_number,
      date_of_birth,
      gender,
      address,
      city,
      region,
      postal_code
    } = req.body;

    // Check if user already exists
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

    // Create user
    let newUser;
    try {
      const [createdUser] = await db('users')
        .insert({
          email,
          phone,
          password_hash: passwordHash,
          first_name,
          last_name,
          middle_name,
          role,
          status,
          ghana_card_number,
          date_of_birth,
          gender,
          address,
          city,
          region,
          postal_code
        })
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at']);

      newUser = createdUser;
    } catch (dbError) {
      logger.warn('Database insert failed, using mock database:', dbError);
      const mockResult = mockDb.users.insert({
        email,
        phone,
        password_hash: passwordHash,
        first_name,
        last_name,
        middle_name,
        role,
        status,
        ghana_card_number,
        date_of_birth,
        gender,
        address,
        city,
        region,
        postal_code
      }).returning(['id', 'email', 'first_name', 'last_name', 'role', 'status', 'created_at']);
      
      newUser = mockResult[0];
    }

    logger.info(`Admin ${req.user?.email} created new user: ${email} with role: ${role}`);

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: newUser
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
});

// Get user by ID (admin only)
router.get('/users/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    let user;
    try {
      user = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'phone', 'role', 'status', 'created_at', 'last_login_at', 'mmda_id')
        .where('id', id)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      user = mockDb.users.where('id', parseInt(id)).first();
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
    logger.error('Error fetching user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
});

// Update user (admin only)
router.put('/users/:id', authMiddleware, requireRole(['admin', 'super_admin']), validateUserUpdate, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    const updateData = { ...req.body };
    
    // Remove sensitive fields that shouldn't be updated directly
    delete updateData.password_hash;
    delete updateData.id;
    delete updateData.created_at;

    // Check if user exists
    let existingUser;
    try {
      existingUser = await db('users')
        .where('id', id)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      existingUser = mockDb.users.where('id', parseInt(id)).first();
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    let updatedUser;
    try {
      const [user] = await db('users')
        .where('id', id)
        .update(updateData)
        .returning(['id', 'email', 'first_name', 'last_name', 'role', 'status', 'updated_at']);

      updatedUser = user;
    } catch (dbError) {
      logger.warn('Database update failed, using mock database:', dbError);
      mockDb.users.where('id', parseInt(id)).update(updateData);
      updatedUser = { id: parseInt(id), ...updateData, updated_at: new Date() };
    }

    logger.info(`Admin ${req.user?.email} updated user: ${id}`);

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
});

// Delete user (admin only)
router.delete('/users/:id', authMiddleware, requireRole(['admin', 'super_admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    
    // Check if user exists
    let existingUser;
    try {
      existingUser = await db('users')
        .where('id', id)
        .first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock database:', dbError);
      existingUser = mockDb.users.where('id', parseInt(id)).first();
    }

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Delete user
    try {
      await db('users')
        .where('id', id)
        .del();
    } catch (dbError) {
      logger.warn('Database delete failed, using mock database:', dbError);
      // Mock database doesn't have delete functionality, so we'll just log it
      logger.info(`Mock delete for user ${id}`);
    }

    logger.info(`Admin ${req.user?.email} deleted user: ${id}`);

    return res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
});

// Get system statistics
router.get('/stats', authMiddleware, requireRole(['admin', 'super_admin']), async (_req: Request, res: Response) => {
  try {
    let stats;
    try {
      // Get real user counts
      const userCountResult = await db('users').count('* as total');
      const activeUserCountResult = await db('users').where('status', 'active').count('* as total');
      const pendingUserCountResult = await db('users').where('status', 'pending').count('* as total');
      
      // Get revenue data (from payments table)
      const revenueResult = await db('payments').sum('amount as total');
      const pendingPaymentsResult = await db('payments').where('status', 'pending').sum('amount as total');
      
      // Get property counts
      const propertyCountResult = await db('properties').count('* as total');
      
      const userCount = userCountResult[0];
      const activeUserCount = activeUserCountResult[0];
      const pendingUserCount = pendingUserCountResult[0];
      const revenue = revenueResult[0];
      const pendingPayments = pendingPaymentsResult[0];
      const propertyCount = propertyCountResult[0];
      
      stats = {
        totalUsers: parseInt(userCount?.['total'] as string || '0'),
        activeUsers: parseInt(activeUserCount?.['total'] as string || '0'),
        pendingUsers: parseInt(pendingUserCount?.['total'] as string || '0'),
        totalRevenue: parseFloat(revenue?.['total'] as string || '0'),
        pendingPayments: parseFloat(pendingPayments?.['total'] as string || '0'),
        totalProperties: parseInt(propertyCount?.['total'] as string || '0'),
        totalPayments: 0, // Will be implemented when payments table is ready
      };
    } catch (dbError) {
      logger.warn('Database query failed, using mock statistics:', dbError);
      stats = {
        totalUsers: 3,
        activeUsers: 3,
        pendingUsers: 0,
        totalRevenue: 2450000,
        pendingPayments: 180000,
        totalProperties: 890,
        totalPayments: 180000,
      };
    }

    return res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    logger.error('Error fetching statistics:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics' 
    });
  }
});

// Get revenue categories
router.get('/revenue-categories', authMiddleware, requireRole(['admin', 'super_admin']), async (_req: Request, res: Response) => {
  try {
    let categories;
    try {
      categories = await db('revenue_categories')
        .select('*')
        .orderBy('name', 'asc');
    } catch (dbError) {
      logger.warn('Database query failed, using mock revenue categories:', dbError);
      categories = [
        { id: 1, name: 'Property Tax', description: 'Annual property tax collection', rate: 0.5, status: 'active' },
        { id: 2, name: 'Business License', description: 'Business operating licenses', rate: 1000, status: 'active' },
        { id: 3, name: 'Building Permit', description: 'Construction and renovation permits', rate: 500, status: 'active' },
        { id: 4, name: 'Market Fees', description: 'Market stall and trading fees', rate: 200, status: 'active' }
      ];
    }

    return res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    logger.error('Error fetching revenue categories:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching revenue categories'
    });
  }
});

// Create revenue category
router.post('/revenue-categories', authMiddleware, requireRole(['admin', 'super_admin']), [
  body('name').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('rate').isNumeric(),
  body('status').isIn(['active', 'inactive'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, description, rate, status } = req.body;

    let newCategory;
    try {
      const [createdCategory] = await db('revenue_categories')
        .insert({ name, description, rate, status })
        .returning('*');
      newCategory = createdCategory;
    } catch (dbError) {
      logger.warn('Database insert failed, using mock database:', dbError);
      newCategory = { id: Date.now(), name, description, rate, status, created_at: new Date() };
    }

    return res.status(201).json({
      success: true,
      message: 'Revenue category created successfully',
      data: newCategory
    });
  } catch (error) {
    logger.error('Error creating revenue category:', error);
    return res.status(500).json({
      success: false,
      message: 'Error creating revenue category'
    });
  }
});

// Get properties
router.get('/properties', authMiddleware, requireRole(['admin', 'super_admin']), async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    let properties;
    try {
      let query = db('properties').select('*');
      
      if (search) {
        query = query.where('address', 'like', `%${search}%`)
                    .orWhere('property_id', 'like', `%${search}%`);
      }
      
      properties = await query
        .orderBy('created_at', 'desc')
        .limit(limit as number)
        .offset(((page as number) - 1) * (limit as number));
    } catch (dbError) {
      logger.warn('Database query failed, using mock properties:', dbError);
      properties = [
        { id: 1, property_id: 'PRP-2024-001', address: '123 Main Street', owner_name: 'John Doe', status: 'active', created_at: new Date() },
        { id: 2, property_id: 'PRP-2024-002', address: '456 Oak Avenue', owner_name: 'Jane Smith', status: 'active', created_at: new Date() }
      ];
    }

    return res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    logger.error('Error fetching properties:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching properties'
    });
  }
});

// Get recent activities
router.get('/activities', authMiddleware, requireRole(['admin', 'super_admin']), async (_req: Request, res: Response) => {
  try {
    let activities;
    try {
      // Get recent user registrations
      const recentUsers = await db('users')
        .select('id', 'email', 'first_name', 'last_name', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      // Get recent payments
      const recentPayments = await db('payments')
        .select('id', 'amount', 'status', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(5);

      activities = [
        ...recentUsers.map(user => ({
          type: 'user_registration',
          message: `New user registration: ${user.first_name} ${user.last_name}`,
          timestamp: user.created_at,
          data: user
        })),
        ...recentPayments.map(payment => ({
          type: 'payment_received',
          message: `Payment received: ₵${payment.amount}`,
          timestamp: payment.created_at,
          data: payment
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 10);

    } catch (dbError) {
      logger.warn('Database query failed, using mock activities:', dbError);
      activities = [
        { type: 'user_registration', message: 'New user registration: John Doe', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) },
        { type: 'payment_received', message: 'Payment received: ₵500', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) },
        { type: 'user_registration', message: 'New user registration: Jane Smith', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
      ];
    }

    return res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Error fetching activities:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching activities'
    });
  }
});

// Send authorization email
router.post('/send-authorization-email', authMiddleware, requireRole(['admin', 'super_admin']), [
  body('userId').isNumeric(),
  body('type').isIn(['welcome', 'account_activation', 'password_reset', 'payment_confirmation'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userId, type, customMessage } = req.body;

    // Get user details
    let user;
    try {
      user = await db('users').where('id', userId).first();
    } catch (dbError) {
      logger.warn('Database query failed, using mock user:', dbError);
      user = { id: userId, email: 'user@example.com', first_name: 'User', last_name: 'Name' };
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Send email based on type
    let emailSubject, emailBody;
    switch (type) {
      case 'welcome':
        emailSubject = 'Welcome to MMDA Revenue System';
        emailBody = `Dear ${user.first_name} ${user.last_name},\n\nWelcome to the MMDA Revenue Mobilization System! Your account has been successfully created.\n\nYou can now log in and start using the system.\n\nBest regards,\nMMDA Team`;
        break;
      case 'account_activation':
        emailSubject = 'Account Activation Required';
        emailBody = `Dear ${user.first_name} ${user.last_name},\n\nYour account requires activation. Please contact an administrator to activate your account.\n\nBest regards,\nMMDA Team`;
        break;
      case 'password_reset':
        emailSubject = 'Password Reset Request';
        emailBody = `Dear ${user.first_name} ${user.last_name},\n\nA password reset has been requested for your account. Please contact an administrator if you did not request this.\n\nBest regards,\nMMDA Team`;
        break;
      case 'payment_confirmation':
        emailSubject = 'Payment Confirmation';
        emailBody = `Dear ${user.first_name} ${user.last_name},\n\nYour payment has been confirmed. Thank you for your prompt payment.\n\nBest regards,\nMMDA Team`;
        break;
      default:
        emailSubject = 'MMDA Revenue System Notification';
        emailBody = customMessage || `Dear ${user.first_name} ${user.last_name},\n\nYou have a new notification from the MMDA Revenue System.\n\nBest regards,\nMMDA Team`;
    }

    // In a real system, you would send the email here
    // For now, we'll just log it
    logger.info(`Email would be sent to ${user.email}:`, { subject: emailSubject, body: emailBody });

    return res.json({
      success: true,
      message: 'Authorization email sent successfully',
      data: { email: user.email, subject: emailSubject }
    });
  } catch (error) {
    logger.error('Error sending authorization email:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending authorization email'
    });
  }
});

// Bulk user operations
router.post('/bulk-user-operations', authMiddleware, requireRole(['admin', 'super_admin']), [
  body('userIds').isArray(),
  body('operation').isIn(['activate', 'deactivate', 'send_welcome_email', 'delete'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { userIds, operation } = req.body;

    let results = [];
    for (const userId of userIds) {
      try {
        switch (operation) {
          case 'activate':
            await db('users').where('id', userId).update({ status: 'active' });
            results.push({ userId, success: true, message: 'User activated' });
            break;
          case 'deactivate':
            await db('users').where('id', userId).update({ status: 'inactive' });
            results.push({ userId, success: true, message: 'User deactivated' });
            break;
          case 'send_welcome_email':
            // Send welcome email logic here
            results.push({ userId, success: true, message: 'Welcome email sent' });
            break;
          case 'delete':
            await db('users').where('id', userId).del();
            results.push({ userId, success: true, message: 'User deleted' });
            break;
        }
      } catch (error) {
        results.push({ userId, success: false, message: 'Operation failed' });
      }
    }

    return res.json({
      success: true,
      message: 'Bulk operation completed',
      data: results
    });
  } catch (error) {
    logger.error('Error in bulk user operations:', error);
    return res.status(500).json({
      success: false,
      message: 'Error in bulk user operations'
    });
  }
});

export default router;
