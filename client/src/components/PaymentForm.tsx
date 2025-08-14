import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Payment as PaymentIcon,
  Phone as PhoneIcon,
  AccountBalance as BankIcon,
  CreditCard as CardIcon,
  AttachMoney as CashIcon,
  Info as InfoIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';

interface PaymentFormProps {
  amount: number;
  description: string;
  reference: string;
  onPaymentComplete?: (paymentData: any) => void;
  onCancel?: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  fees: string;
  processingTime: string;
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'mobile_money',
    name: 'Mobile Money',
    icon: <PhoneIcon />,
    description: 'Pay using your mobile money wallet',
    fees: '₵0.30 - ₵0.50',
    processingTime: 'Instant'
  },
  {
    id: 'bank_transfer',
    name: 'Bank Transfer',
    icon: <BankIcon />,
    description: 'Transfer directly to your bank account',
    fees: '₵3.50 - ₵5.00',
    processingTime: '1-4 hours'
  },
  {
    id: 'card_payment',
    name: 'Card Payment',
    icon: <CardIcon />,
    description: 'Pay using your debit or credit card',
    fees: '2.5%',
    processingTime: 'Instant'
  },
  {
    id: 'cash',
    name: 'Cash Payment',
    icon: <CashIcon />,
    description: 'Pay in cash at our offices',
    fees: '₵0.00',
    processingTime: 'Immediate upon verification'
  }
];

const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  description,
  reference,
  onPaymentComplete,
  onCancel
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form fields based on payment method
  const [formData, setFormData] = useState({
    phone: '',
    mobileMoneyProvider: '',
    beneficiaryAccount: '',
    beneficiaryBank: '',
    beneficiaryName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cardHolderName: ''
  });

  const steps = ['Select Payment Method', 'Enter Details', 'Confirm & Pay'];

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setActiveStep(1);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedMethod === 'mobile_money') {
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.mobileMoneyProvider) newErrors.mobileMoneyProvider = 'Provider is required';
    } else if (selectedMethod === 'bank_transfer') {
      if (!formData.beneficiaryAccount) newErrors.beneficiaryAccount = 'Account number is required';
      if (!formData.beneficiaryBank) newErrors.beneficiaryBank = 'Bank is required';
      if (!formData.beneficiaryName) newErrors.beneficiaryName = 'Account name is required';
    } else if (selectedMethod === 'card_payment') {
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      if (!formData.cardExpiry) newErrors.cardExpiry = 'Expiry date is required';
      if (!formData.cardCvv) newErrors.cardCvv = 'CVV is required';
      if (!formData.cardHolderName) newErrors.cardHolderName = 'Card holder name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 1 && !validateForm()) {
      return;
    }
    if (activeStep === 1) {
      setActiveStep(2);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handlePayment = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentPayload = {
        amount,
        reference,
        description,
        paymentMethod: selectedMethod,
        ...formData
      };

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentPayload)
      });

      const result = await response.json();

      if (result.success) {
        setPaymentData(result.data);
        toast.success('Payment initiated successfully!');
        onPaymentComplete?.(result.data);
        setActiveStep(3); // Success step
      } else {
        toast.error(result.message || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderMethodSelection = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose Payment Method
      </Typography>
      <Grid container spacing={3}>
        {paymentMethods.map((method) => (
          <Grid item xs={12} sm={6} key={method.id}>
            <Card
              sx={{
                cursor: 'pointer',
                border: selectedMethod === method.id ? '2px solid #1976d2' : '1px solid #e0e0e0',
                '&:hover': { borderColor: '#1976d2' }
              }}
              onClick={() => handleMethodSelect(method.id)}
            >
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  {method.icon}
                  <Typography variant="h6" ml={1}>
                    {method.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="textSecondary" mb={2}>
                  {method.description}
                </Typography>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Chip label={`Fee: ${method.fees}`} size="small" color="primary" variant="outlined" />
                  <Chip label={method.processingTime} size="small" color="secondary" variant="outlined" />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderPaymentDetails = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Payment Details
      </Typography>
      
      {selectedMethod === 'mobile_money' && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+233200000000"
              error={!!errors.phone}
              helperText={errors.phone}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.mobileMoneyProvider}>
              <InputLabel>Mobile Money Provider</InputLabel>
              <Select
                value={formData.mobileMoneyProvider}
                onChange={(e) => handleInputChange('mobileMoneyProvider', e.target.value)}
                label="Mobile Money Provider"
              >
                <MenuItem value="mtn">MTN Mobile Money</MenuItem>
                <MenuItem value="vodafone">Vodafone Cash</MenuItem>
                <MenuItem value="airteltigo">AirtelTigo Money</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}

      {selectedMethod === 'bank_transfer' && (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Account Number"
              value={formData.beneficiaryAccount}
              onChange={(e) => handleInputChange('beneficiaryAccount', e.target.value)}
              error={!!errors.beneficiaryAccount}
              helperText={errors.beneficiaryAccount}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.beneficiaryBank}>
              <InputLabel>Bank</InputLabel>
              <Select
                value={formData.beneficiaryBank}
                onChange={(e) => handleInputChange('beneficiaryBank', e.target.value)}
                label="Bank"
              >
                <MenuItem value="002">GCB Bank</MenuItem>
                <MenuItem value="005">Standard Chartered Bank Ghana</MenuItem>
                <MenuItem value="007">Ecobank Ghana</MenuItem>
                <MenuItem value="008">Fidelity Bank Ghana</MenuItem>
                <MenuItem value="ghipss">Other Banks (via GhIPSS)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Account Holder Name"
              value={formData.beneficiaryName}
              onChange={(e) => handleInputChange('beneficiaryName', e.target.value)}
              error={!!errors.beneficiaryName}
              helperText={errors.beneficiaryName}
            />
          </Grid>
        </Grid>
      )}

      {selectedMethod === 'card_payment' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Card Number"
              value={formData.cardNumber}
              onChange={(e) => handleInputChange('cardNumber', e.target.value)}
              placeholder="1234 5678 9012 3456"
              error={!!errors.cardNumber}
              helperText={errors.cardNumber}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Expiry Date"
              value={formData.cardExpiry}
              onChange={(e) => handleInputChange('cardExpiry', e.target.value)}
              placeholder="MM/YY"
              error={!!errors.cardExpiry}
              helperText={errors.cardExpiry}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="CVV"
              value={formData.cardCvv}
              onChange={(e) => handleInputChange('cardCvv', e.target.value)}
              placeholder="123"
              error={!!errors.cardCvv}
              helperText={errors.cardCvv}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Card Holder Name"
              value={formData.cardHolderName}
              onChange={(e) => handleInputChange('cardHolderName', e.target.value)}
              error={!!errors.cardHolderName}
              helperText={errors.cardHolderName}
            />
          </Grid>
        </Grid>
      )}

      {selectedMethod === 'cash' && (
        <Alert severity="info" icon={<InfoIcon />}>
          <Typography variant="body2">
            For cash payments, please visit any of our MMDA offices or designated collection points.
            You will need to provide this reference number: <strong>{reference}</strong>
          </Typography>
        </Alert>
      )}

      <Box mt={3} display="flex" justifyContent="space-between">
        <Button onClick={handleBack}>Back</Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={!selectedMethod}
        >
          Next
        </Button>
      </Box>
    </Box>
  );

  const renderConfirmation = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Confirm Payment
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Amount:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">₵{amount.toFixed(2)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Payment Method:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">
                {paymentMethods.find(m => m.id === selectedMethod)?.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Reference:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">{reference}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="textSecondary">Description:</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body1">{description}</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between">
        <Button onClick={handleBack}>Back</Button>
        <Button
          variant="contained"
          onClick={handlePayment}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
        >
          {loading ? 'Processing...' : 'Confirm Payment'}
        </Button>
      </Box>
    </Box>
  );

  const renderSuccess = () => (
    <Box textAlign="center">
      <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        Payment Successful!
      </Typography>
      <Typography variant="body1" color="textSecondary" mb={3}>
        Your payment has been processed successfully.
      </Typography>
      
      {paymentData.paymentResponse && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Transaction Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Transaction ID:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">{paymentData.paymentResponse.transactionId}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Status:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Chip 
                  label={paymentData.paymentResponse.status} 
                  color={paymentData.paymentResponse.status === 'success' ? 'success' : 'warning'}
                />
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body1">₵{paymentData.paymentResponse.totalAmount?.toFixed(2)}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
      
      <Button variant="contained" onClick={() => onCancel?.()}>
        Close
      </Button>
    </Box>
  );

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return renderMethodSelection();
      case 1:
        return renderPaymentDetails();
      case 2:
        return renderConfirmation();
      case 3:
        return renderSuccess();
      default:
        return null;
    }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <PaymentIcon sx={{ mr: 1 }} />
        <Typography variant="h5">
          Payment Form
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}
    </Box>
  );
};

export default PaymentForm;
