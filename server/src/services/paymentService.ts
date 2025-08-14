import { logger } from '../utils/logger';
import { 
  getMobileMoneyService, 
  MobileMoneyRequest
} from './mobileMoneyService';
import { 
  getBankService, 
  BankTransferRequest,
  GHANAIAN_BANKS 
} from './bankTransferService';
import { paymentConfig } from '../config/paymentConfig';

export interface PaymentRequest {
  amount: number;
  reference: string;
  description: string;
  paymentMethod: 'mobile_money' | 'bank_transfer' | 'card_payment' | 'cash';
  // Mobile money specific fields
  phone?: string;
  mobileMoneyProvider?: 'mtn' | 'vodafone' | 'airteltigo';
  // Bank transfer specific fields
  beneficiaryAccount?: string;
  beneficiaryBank?: string;
  beneficiaryName?: string;
  // Card payment specific fields
  cardNumber?: string;
  cardExpiry?: string;
  cardCvv?: string;
  cardHolderName?: string;
  // General fields
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  reference: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  message: string;
  paymentMethod: string;
  provider?: string;
  amount: number;
  fee: number;
  totalAmount: number;
  estimatedSettlementTime?: string;
  receiptUrl?: string;
  metadata?: Record<string, any>;
}

export class PaymentService {
  constructor() {
    // No config needed as services now get config from paymentConfig
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info(`Processing payment: ${request.paymentMethod} for amount: ${request.amount}, reference: ${request.reference}`);

      switch (request.paymentMethod) {
        case 'mobile_money':
          return await this.processMobileMoneyPayment(request);
        case 'bank_transfer':
          return await this.processBankTransfer(request);
        case 'card_payment':
          return await this.processCardPayment(request);
        case 'cash':
          return await this.processCashPayment(request);
        default:
          throw new Error(`Unsupported payment method: ${request.paymentMethod}`);
      }
    } catch (error: any) {
      logger.error('Payment processing error:', error);
      return {
        success: false,
        reference: request.reference,
        status: 'failed',
        message: error.message || 'Payment processing failed',
        paymentMethod: request.paymentMethod,
        amount: request.amount,
        fee: 0,
        totalAmount: request.amount
      };
    }
  }

  private async processMobileMoneyPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.phone || !request.mobileMoneyProvider) {
      throw new Error('Phone number and mobile money provider are required for mobile money payments');
    }

    // Ensure the provider is one of the valid types
    const validProvider = request.mobileMoneyProvider as 'mtn' | 'vodafone' | 'airtelTigo';
    const mobileMoneyService = getMobileMoneyService(validProvider);
    
    const mobileMoneyRequest: MobileMoneyRequest = {
      phone: request.phone,
      amount: request.amount,
      reference: request.reference,
      description: request.description,
      callbackUrl: request.callbackUrl || paymentConfig.general.callbackUrl
    };

    const response = await mobileMoneyService.initiatePayment(mobileMoneyRequest);

    const result: PaymentResponse = {
      success: response.success,
      reference: response.reference || request.reference,
      status: response.status,
      message: response.message,
      paymentMethod: 'mobile_money',
      provider: response.provider,
      amount: response.amount,
      fee: response.fee,
      totalAmount: response.totalAmount,
      metadata: {
        phone: request.phone,
        provider: request.mobileMoneyProvider,
        ...request.metadata
      }
    };

    if (response.transactionId) {
      result.transactionId = response.transactionId;
    }

    return result;
  }

  private async processBankTransfer(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.beneficiaryAccount || !request.beneficiaryBank || !request.beneficiaryName) {
      throw new Error('Beneficiary account, bank, and name are required for bank transfers');
    }

    // Determine bank service type based on beneficiary bank
    const bankServiceType = this.getBankServiceType(request.beneficiaryBank) as 'ghipss' | 'gcb';
    const bankService = getBankService(bankServiceType);

    const bankRequest: BankTransferRequest = {
      amount: request.amount,
      reference: request.reference,
      description: request.description,
      beneficiaryAccount: request.beneficiaryAccount,
      beneficiaryBank: request.beneficiaryBank,
      beneficiaryName: request.beneficiaryName,
      callbackUrl: request.callbackUrl || paymentConfig.general.callbackUrl
    };

    const response = await bankService.initiateTransfer(bankRequest);

    const result: PaymentResponse = {
      success: response.success,
      reference: response.reference || request.reference,
      status: response.status,
      message: response.message,
      paymentMethod: 'bank_transfer',
      provider: response.bank,
      amount: response.amount,
      fee: response.fee,
      totalAmount: response.totalAmount,
      metadata: {
        beneficiaryAccount: request.beneficiaryAccount,
        beneficiaryBank: request.beneficiaryBank,
        beneficiaryName: request.beneficiaryName,
        ...request.metadata
      }
    };

    if (response.transactionId) {
      result.transactionId = response.transactionId;
    }

    if (response.estimatedSettlementTime) {
      result.estimatedSettlementTime = response.estimatedSettlementTime;
    }

    return result;
  }

  private async processCardPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!request.cardNumber || !request.cardExpiry || !request.cardCvv || !request.cardHolderName) {
      throw new Error('Card details are required for card payments');
    }

    // For now, we'll simulate card payment processing
    // In production, this would integrate with a payment gateway like Paystack, Flutterwave, etc.
    logger.info(`Processing card payment for ${request.cardHolderName}, amount: ${request.amount}`);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate successful card payment
    const cardFee = request.amount * 0.025; // 2.5% card processing fee
    const transactionId = `CARD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId,
      reference: request.reference,
      status: 'success',
      message: 'Card payment processed successfully',
      paymentMethod: 'card_payment',
      provider: 'Card Gateway',
      amount: request.amount,
      fee: cardFee,
      totalAmount: request.amount + cardFee,
      receiptUrl: `${paymentConfig.general.callbackUrl}/receipt/${request.reference}`,
      metadata: {
        cardLast4: request.cardNumber.slice(-4),
        cardHolderName: request.cardHolderName,
        ...request.metadata
      }
    };
  }

  private async processCashPayment(request: PaymentRequest): Promise<PaymentResponse> {
    logger.info(`Processing cash payment for amount: ${request.amount}, reference: ${request.reference}`);

    // Cash payments are always successful but require manual verification
    const transactionId = `CASH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      success: true,
      transactionId,
      reference: request.reference,
      status: 'pending',
      message: 'Cash payment received, awaiting verification',
      paymentMethod: 'cash',
      provider: 'Cash Collection',
      amount: request.amount,
      fee: 0,
      totalAmount: request.amount,
      metadata: {
        collectionMethod: 'cash',
        requiresVerification: true,
        ...request.metadata
      }
    };
  }

  private getBankServiceType(bankCode: string): string {
    // Map bank codes to service types
    if (bankCode === '002') {
      return 'gcb';
    }
    // Default to GhIPSS for other banks
    return 'ghipss';
  }

  async checkPaymentStatus(transactionId: string, paymentMethod: string): Promise<PaymentResponse | null> {
    try {
      logger.info(`Checking payment status for ${transactionId}, method: ${paymentMethod}`);

      switch (paymentMethod) {
        case 'mobile_money':
          return await this.checkMobileMoneyStatus(transactionId);
        case 'bank_transfer':
          return await this.checkBankTransferStatus(transactionId);
        case 'card_payment':
        case 'cash':
          // For card and cash payments, we'll return a mock status
          return await this.checkMockPaymentStatus(transactionId, paymentMethod);
        default:
          throw new Error(`Unsupported payment method for status check: ${paymentMethod}`);
      }
    } catch (error: any) {
      logger.error('Payment status check error:', error);
      return null;
    }
  }

  private async checkMobileMoneyStatus(transactionId: string): Promise<PaymentResponse | null> {
    // Try to determine provider from transaction ID format or use a default
    const provider = this.determineMobileMoneyProvider(transactionId) as 'mtn' | 'vodafone' | 'airtelTigo';
    const mobileMoneyService = getMobileMoneyService(provider);
    
    const response = await mobileMoneyService.checkPaymentStatus(transactionId);
    
    const result: PaymentResponse = {
      success: response.success,
      reference: response.reference || '',
      status: response.status,
      message: response.message,
      paymentMethod: 'mobile_money',
      provider: response.provider,
      amount: response.amount,
      fee: response.fee,
      totalAmount: response.totalAmount
    };

    if (response.transactionId) {
      result.transactionId = response.transactionId;
    }

    return result;
  }

  private async checkBankTransferStatus(transactionId: string): Promise<PaymentResponse | null> {
    // Use GhIPSS as default for status checks
    const bankService = getBankService('ghipss');
    
    const response = await bankService.checkTransferStatus(transactionId);
    
    const result: PaymentResponse = {
      success: response.success,
      reference: response.reference || '',
      status: response.status,
      message: response.message,
      paymentMethod: 'bank_transfer',
      provider: response.bank,
      amount: response.amount,
      fee: response.fee,
      totalAmount: response.totalAmount
    };

    if (response.transactionId) {
      result.transactionId = response.transactionId;
    }

    if (response.estimatedSettlementTime) {
      result.estimatedSettlementTime = response.estimatedSettlementTime;
    }

    return result;
  }

  private async checkMockPaymentStatus(transactionId: string, paymentMethod: string): Promise<PaymentResponse> {
    // Simulate status check for card and cash payments
    await new Promise(resolve => setTimeout(resolve, 500));

    return {
      success: true,
      transactionId,
      reference: transactionId,
      status: 'success',
      message: 'Payment verified successfully',
      paymentMethod,
      provider: paymentMethod === 'card_payment' ? 'Card Gateway' : 'Cash Collection',
      amount: 0, // Would be retrieved from database
      fee: 0,
      totalAmount: 0
    };
  }

  private determineMobileMoneyProvider(transactionId: string): string {
    // Determine provider from transaction ID format
    if (transactionId.includes('MTN') || transactionId.startsWith('M')) {
      return 'mtn';
    } else if (transactionId.includes('VOD') || transactionId.startsWith('V')) {
      return 'vodafone';
    } else if (transactionId.includes('ATL') || transactionId.startsWith('A')) {
      return 'airteltigo';
    }
    // Default to MTN
    return 'mtn';
  }

  // Get available payment methods and their fees
  getPaymentMethods(): Record<string, any> {
    return {
      mobile_money: {
        providers: ['MTN', 'Vodafone', 'AirtelTigo'],
        fees: {
          mtn: 0.50,
          vodafone: 0.30,
          airteltigo: 0.40
        },
        processingTime: 'Instant',
        description: 'Pay using your mobile money wallet'
      },
      bank_transfer: {
        banks: GHANAIAN_BANKS,
        fees: {
          ghipss: 5.00,
          gcb: 3.50
        },
        processingTime: '1-4 hours',
        description: 'Transfer directly to your bank account'
      },
      card_payment: {
        cards: ['Visa', 'Mastercard', 'Verve'],
        fees: '2.5%',
        processingTime: 'Instant',
        description: 'Pay using your debit or credit card'
      },
      cash: {
        locations: ['MMDA Offices', 'Designated Collection Points'],
        fees: 0,
        processingTime: 'Immediate upon verification',
        description: 'Pay in cash at our offices'
      }
    };
  }
}
