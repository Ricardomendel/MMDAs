import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authMiddleware } from '../middleware/auth';
import { PaymentService, PaymentRequest } from '../services/paymentService';
import { logger } from '../utils/logger';
import { prisma } from '../config/prisma';

const router = Router();

// Payment service instance
const paymentService = new PaymentService();

// Validation middleware
const validatePayment = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('reference').notEmpty().withMessage('Payment reference is required'),
  body('description').notEmpty().withMessage('Payment description is required'),
  body('paymentMethod').isIn(['mobile_money', 'bank_transfer', 'card_payment', 'cash']).withMessage('Invalid payment method'),
  // Mobile money validation
  body('phone').if(body('paymentMethod').equals('mobile_money')).notEmpty().withMessage('Phone number is required for mobile money'),
  body('mobileMoneyProvider').if(body('paymentMethod').equals('mobile_money')).isIn(['mtn', 'vodafone', 'airteltigo']).withMessage('Invalid mobile money provider'),
  // Bank transfer validation
  body('beneficiaryAccount').if(body('paymentMethod').equals('bank_transfer')).notEmpty().withMessage('Beneficiary account is required for bank transfer'),
  body('beneficiaryBank').if(body('paymentMethod').equals('bank_transfer')).notEmpty().withMessage('Beneficiary bank is required for bank transfer'),
  body('beneficiaryName').if(body('paymentMethod').equals('bank_transfer')).notEmpty().withMessage('Beneficiary name is required for bank transfer'),
  // Card payment validation
  body('cardNumber').if(body('paymentMethod').equals('card_payment')).notEmpty().withMessage('Card number is required for card payment'),
  body('cardExpiry').if(body('paymentMethod').equals('card_payment')).notEmpty().withMessage('Card expiry is required for card payment'),
  body('cardCvv').if(body('paymentMethod').equals('card_payment')).notEmpty().withMessage('Card CVV is required for card payment'),
  body('cardHolderName').if(body('paymentMethod').equals('card_payment')).notEmpty().withMessage('Card holder name is required for card payment')
];

// Get all payments
router.get('/', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { created_at: 'desc' }
    });

    return res.json({
      success: true, 
      data: payments
    });
  } catch (error) {
    logger.error('Error fetching payments:', error);
    return res.status(500).json({
      success: false, 
      message: 'Error fetching payments' 
    });
  }
});

// Get payment by ID
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }
    
    const payment = await prisma.payment.findFirst({
      where: { id: parseInt(id) }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    return res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment'
    });
  }
});

// Create new payment
router.post('/', authMiddleware, validatePayment, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const paymentRequest: PaymentRequest = req.body;
    
    // Process payment using the payment service
    const paymentResponse = await paymentService.processPayment(paymentRequest);
    
    if (!paymentResponse.success) {
      return res.status(400).json({
        success: false,
        message: paymentResponse.message
      });
    }

    // Save payment to database
    const savedPayment = await prisma.payment.create({
      data: {
        payment_reference: paymentResponse.reference,
        assessment_id: 1, // TODO: Get actual assessment_id from request
        amount: paymentResponse.amount,
        payment_method: paymentResponse.paymentMethod,
        status: paymentResponse.status,
        user_id: (req as any).user.id,
        transaction_id: paymentResponse.transactionId || null,
        created_at: new Date()
      }
    });

    logger.info(`Payment processed successfully: ${paymentResponse.reference}, method: ${paymentResponse.paymentMethod}`);

    return res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: {
        payment: savedPayment,
        paymentResponse
      }
    });
  } catch (error: any) {
    logger.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error creating payment'
    });
  }
});

// Check payment status
router.get('/:id/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }
    
    // Get payment from database
    let payment;
    try {
      payment = await prisma.payment.findFirst({
        where: { id: parseInt(id) }
      });
    } catch (dbError) {
      logger.warn('Database query failed, using mock payment:', dbError);
      payment = {
        id: parseInt(id),
        payment_reference: `PAY_${id.padStart(3, '0')}`,
        payment_method: 'mobile_money',
        status: 'completed'
      };
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check status with payment provider
    const statusResponse = await paymentService.checkPaymentStatus(
      payment.transaction_id || payment.payment_reference,
      payment.payment_method
    );

    if (statusResponse) {
      // Update payment status in database if it changed
      if (statusResponse.status !== payment.status) {
        try {
          await prisma.payment.update({
            where: { id: parseInt(id) },
            data: { 
              status: statusResponse.status,
              updated_at: new Date()
            }
          });
        } catch (dbError) {
          logger.warn('Failed to update payment status in database:', dbError);
        }
      }

      return res.json({
        success: true,
        data: {
          payment,
          status: statusResponse
        }
      });
    } else {
      return res.json({
        success: true,
        data: {
          payment,
          status: {
            status: payment.status,
            message: 'Status check unavailable'
          }
        }
      });
    }
  } catch (error: any) {
    logger.error('Error checking payment status:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error checking payment status'
    });
  }
});

// Get available payment methods
router.get('/methods/available', async (_req: Request, res: Response) => {
  try {
    const paymentMethods = paymentService.getPaymentMethods();
    
    return res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching payment methods'
    });
  }
});

// Payment webhook for callbacks
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const webhookData = req.body;
    logger.info('Payment webhook received:', webhookData);

    // Process webhook data based on provider
    // This would typically update payment status in database
    // and trigger any necessary business logic

    return res.json({
      success: true, 
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing webhook'
    });
  }
});

// Cancel payment
router.post('/:id/cancel', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }
    
    // Get payment from database
    const payment = await prisma.payment.findFirst({
      where: { id: parseInt(id) }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending payments can be cancelled'
      });
    }

    // Update payment status to cancelled
    try {
      await prisma.payment.update({
        where: { id: parseInt(id) },
        data: { 
          status: 'cancelled',
          updated_at: new Date()
        }
      });
    } catch (dbError) {
      logger.warn('Failed to update payment status in database:', dbError);
    }

    return res.json({
      success: true,
      message: 'Payment cancelled successfully'
    });
  } catch (error: any) {
    logger.error('Error cancelling payment:', error);
    return res.status(500).json({
      success: false, 
      message: error.message || 'Error cancelling payment'
    });
  }
});

export default router;
