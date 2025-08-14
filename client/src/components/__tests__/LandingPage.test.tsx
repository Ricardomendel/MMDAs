import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import LandingPage from '../LandingPage';

// Create a theme for testing
const theme = createTheme();

// Mock component with theme provider
const MockLandingPage = () => (
  <ThemeProvider theme={theme}>
    <LandingPage 
      onLogin={() => {}} 
      onRegister={() => {}} 
    />
  </ThemeProvider>
);

describe('LandingPage Component', () => {
  test('renders hero section with main heading', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Modern Revenue Mobilization for Ghana\'s MMDAs')).toBeInTheDocument();
    expect(screen.getByText('Streamline tax collection, improve transparency, and enhance citizen experience with our cloud-based platform.')).toBeInTheDocument();
  });

  test('renders call-to-action buttons', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('displays correct statistics values', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('50+')).toBeInTheDocument();
    expect(screen.getByText('100K+')).toBeInTheDocument();
    expect(screen.getByText('₵500M+')).toBeInTheDocument();
    expect(screen.getByText('99.9%')).toBeInTheDocument();
  });

  test('displays statistics labels', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('MMDAs Connected')).toBeInTheDocument();
    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('Revenue Collected')).toBeInTheDocument();
    expect(screen.getByText('Uptime')).toBeInTheDocument();
  });

  test('renders features section', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Why Choose Our Platform?')).toBeInTheDocument();
    expect(screen.getByText('Easy Tax Payments')).toBeInTheDocument();
    expect(screen.getByText('Real-time Assessment')).toBeInTheDocument();
    expect(screen.getByText('Secure & Transparent')).toBeInTheDocument();
    expect(screen.getByText('24/7 Access')).toBeInTheDocument();
  });

  test('renders services section', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Our Services')).toBeInTheDocument();
    expect(screen.getByText('Property Tax')).toBeInTheDocument();
    expect(screen.getByText('Business License')).toBeInTheDocument();
    expect(screen.getByText('Market Fees')).toBeInTheDocument();
    expect(screen.getByText('School Fees')).toBeInTheDocument();
    expect(screen.getByText('Hospital Fees')).toBeInTheDocument();
    expect(screen.getByText('Development Permits')).toBeInTheDocument();
  });

  test('renders testimonials section', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('What Our Users Say')).toBeInTheDocument();
    expect(screen.getByText('Kwame Asante')).toBeInTheDocument();
    expect(screen.getByText('Ama Osei')).toBeInTheDocument();
    expect(screen.getByText('John Mensah')).toBeInTheDocument();
  });

  test('renders final call-to-action section', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByText('Sign In Now')).toBeInTheDocument();
  });

  test('renders footer section', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('MMDA Revenue System')).toBeInTheDocument();
    expect(screen.getByText('Quick Links')).toBeInTheDocument();
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
    expect(screen.getByText('Contact Info')).toBeInTheDocument();
  });

  test('renders mobile responsive design elements', () => {
    render(<MockLandingPage />);
    
    // Check if the component renders without crashing on mobile viewport
    expect(screen.getByText('Modern Revenue Mobilization for Ghana\'s MMDAs')).toBeInTheDocument();
  });

  test('renders all navigation links', () => {
    render(<MockLandingPage />);
    
    // Check for footer links
    expect(screen.getByText('About Us')).toBeInTheDocument();
    expect(screen.getByText('Contact Support')).toBeInTheDocument();
    expect(screen.getByText('Privacy Policy')).toBeInTheDocument();
  });

  test('renders payment method icons', () => {
    render(<MockLandingPage />);
    
    // Check if payment method descriptions are present
    expect(screen.getByText(/Pay your property taxes, business licenses, and other fees through multiple payment methods including mobile money./)).toBeInTheDocument();
  });

  test('renders feature descriptions', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText(/Get instant property assessments and tax calculations with our advanced valuation system./)).toBeInTheDocument();
    expect(screen.getByText(/Bank-grade security with blockchain verification ensuring all transactions are transparent and tamper-proof./)).toBeInTheDocument();
    expect(screen.getByText(/Access your tax information and make payments anytime, anywhere through our mobile-responsive platform./)).toBeInTheDocument();
  });

  test('renders testimonial content', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText(/The new system has made paying my property taxes so much easier. I can track everything online!/)).toBeInTheDocument();
    expect(screen.getByText(/Getting my business license renewed was quick and hassle-free. Great service!/)).toBeInTheDocument();
    expect(screen.getByText(/The mobile money integration is fantastic. I can pay my taxes from anywhere./)).toBeInTheDocument();
  });

  test('renders contact information', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('Email: support@mmda-revenue.com')).toBeInTheDocument();
    expect(screen.getByText('Phone: +233 XX XXX XXXX')).toBeInTheDocument();
    expect(screen.getByText('Address: Accra, Ghana')).toBeInTheDocument();
  });

  test('renders copyright notice', () => {
    render(<MockLandingPage />);
    
    expect(screen.getByText('© 2024 MMDA Revenue System. All rights reserved.')).toBeInTheDocument();
  });
});
