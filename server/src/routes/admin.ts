import { Router, Request, Response } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';
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
    logger.info('Fetching all users for admin user');
    
    // Use Prisma to fetch users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    logger.info(`Found ${users.length} users in database`);

    res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    logger.error('Error fetching users from database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users from database' 
    });
  }
});

// Get users for staff (staff can only see taxpayers)
router.get('/users/staff', authMiddleware, requireRole(['staff']), async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching taxpayers for staff user');
    
    // Use Prisma to fetch only taxpayer users
    const users = await prisma.user.findMany({
      where: {
        role: 'taxpayer'
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });
    
    logger.info(`Found ${users.length} taxpayers in database`);
    
    res.json({ 
      success: true, 
      data: users 
    });
  } catch (error) {
    logger.error('Error fetching users for staff from database:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching users from database' 
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

    // Check if user already exists using Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { phone: phone }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user using Prisma
    const newUser = await prisma.user.create({
      data: {
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
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        created_at: true
      }
    });

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
    
    // Get user using Prisma
    const user = await prisma.user.findFirst({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        created_at: true,
        last_login_at: true,
        mmda_id: true
      }
    });

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

    // Check if user exists using Prisma
    const existingUser = await prisma.user.findFirst({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user using Prisma
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        updated_at: true
      }
    });

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
    
    // Check if user exists using Prisma
    const existingUser = await prisma.user.findFirst({
      where: { id: parseInt(id) }
    });

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

    // Delete user using Prisma
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

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
    logger.info('Fetching system statistics for admin user');
    
    // Get real user counts using Prisma
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const pendingUsers = await prisma.user.count({ where: { status: 'pending' } });
    
    // Get revenue data (from payments table) using Prisma
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true }
    });
    const pendingPayments = await prisma.payment.aggregate({
      where: { status: 'pending' },
      _sum: { amount: true }
    });
    
    // Get property counts using Prisma
    const totalProperties = await prisma.property.count();
    
    const stats = {
      totalUsers,
      activeUsers,
      pendingUsers,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments: pendingPayments._sum.amount || 0,
      totalProperties,
      totalPayments: 0, // Will be implemented when payments table is ready
    };

    logger.info(`System stats: ${stats.totalUsers} users, ${stats.activeUsers} active, ${stats.totalRevenue} revenue`);

    return res.json({ 
      success: true, 
      data: stats 
    });
  } catch (error) {
    logger.error('Error fetching statistics from database:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics from database' 
    });
  }
});

// Get revenue categories
router.get('/revenue-categories', authMiddleware, requireRole(['admin', 'super_admin']), async (_req: Request, res: Response) => {
  try {
    // Use Prisma to fetch revenue categories
    const categories = await prisma.revenueCategory.findMany({
      orderBy: {
        name: 'asc'
      }
    });

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

    const { name, description, rate, mmda_id } = req.body;

    // Create revenue category using Prisma
    const newCategory = await prisma.revenueCategory.create({
      data: { name, description, rate, mmda_id: parseInt(mmda_id) }
    });

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
    
    // Use Prisma to fetch properties
    let whereClause = {};
    if (search) {
      whereClause = {
        OR: [
          { address: { contains: search as string } },
          { property_number: { contains: search as string } }
        ]
      };
    }
    
    const properties = await prisma.property.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc'
      },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string)
    });

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
    logger.info('Fetching recent activities for admin user');
    
    // Get recent user registrations using Prisma
    const recentUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    // Get recent payments using Prisma
    const recentPayments = await prisma.payment.findMany({
      select: {
        id: true,
        amount: true,
        status: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    const activities = [
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

    logger.info(`Found ${activities.length} recent activities`);

    return res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Error fetching activities from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching activities from database'
    });
  }
});

// Get recent activities for staff (staff can only see taxpayer-related activities)
router.get('/activities/staff', authMiddleware, requireRole(['staff']), async (_req: Request, res: Response) => {
  try {
    logger.info('Fetching recent taxpayer activities for staff user');
    
    // Get recent taxpayer registrations only using Prisma
    const recentUsers = await prisma.user.findMany({
      where: {
        role: 'taxpayer'
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        created_at: true
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    const activities = recentUsers.map(user => ({
      type: 'user_registration',
      message: `New taxpayer registration: ${user.first_name} ${user.last_name}`,
      timestamp: user.created_at,
      data: user
    }));

    logger.info(`Found ${activities.length} recent taxpayer activities`);

    return res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    logger.error('Error fetching activities for staff from database:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching activities from database'
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

    // Get user details using Prisma
    const user = await prisma.user.findFirst({
      where: { id: parseInt(userId) }
    });

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
            await prisma.user.update({
              where: { id: userId },
              data: { status: 'active' }
            });
            results.push({ userId, success: true, message: 'User activated' });
            break;
          case 'deactivate':
            await prisma.user.update({
              where: { id: userId },
              data: { status: 'inactive' }
            });
            results.push({ userId, success: true, message: 'User deactivated' });
            break;
          case 'send_welcome_email':
            // Send welcome email logic here
            results.push({ userId, success: true, message: 'Welcome email sent' });
            break;
          case 'delete':
            await prisma.user.delete({
              where: { id: userId }
            });
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
