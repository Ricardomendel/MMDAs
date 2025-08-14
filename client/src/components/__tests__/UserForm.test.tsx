import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserForm from '../UserForm';

const theme = createTheme();

const MockUserForm = (props: any) => (
  <ThemeProvider theme={theme}>
    <UserForm {...props} />
  </ThemeProvider>
);

describe('UserForm Component', () => {
  const defaultProps = {
    open: true,
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    user: null,
    isEdit: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form dialog when open', () => {
    render(<MockUserForm {...defaultProps} />);
    
    expect(screen.getByText(/Add New User/i)).toBeInTheDocument();
  });

  test('renders edit form when editing existing user', () => {
    const user = {
      id: 1,
      email: 'test@example.com',
      first_name: 'John',
      last_name: 'Doe',
      phone: '+233123456789',
      role: 'taxpayer',
      status: 'active',
    };

    render(<MockUserForm {...defaultProps} user={user} isEdit={true} />);
    
    expect(screen.getByText(/Edit User/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
  });

  test('renders all required form fields', () => {
    render(<MockUserForm {...defaultProps} />);
    
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Status/i)).toBeInTheDocument();
  });

  test('validates required fields on submit', async () => {
    const onSubmit = jest.fn();
    render(<MockUserForm {...defaultProps} onSubmit={onSubmit} />);
    
    const submitButton = screen.getByText(/Add User/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  test('submits form with valid data', async () => {
    const onSubmit = jest.fn();
    render(<MockUserForm {...defaultProps} onSubmit={onSubmit} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+233123456789' },
    });
    
    const submitButton = screen.getByText(/Add User/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        first_name: 'John',
        last_name: 'Doe',
        phone: '+233123456789',
        role: 'taxpayer',
        status: 'active',
      });
    });
  });

  test('validates email format', async () => {
    const onSubmit = jest.fn();
    render(<MockUserForm {...defaultProps} onSubmit={onSubmit} />);
    
    // Fill in fields with invalid email
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+233123456789' },
    });
    
    const submitButton = screen.getByText(/Add User/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  test('validates password length', async () => {
    const onSubmit = jest.fn();
    render(<MockUserForm {...defaultProps} onSubmit={onSubmit} />);
    
    // Fill in fields with short password
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: '123' },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '+233123456789' },
    });
    
    const submitButton = screen.getByText(/Add User/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  test('validates phone number format', async () => {
    const onSubmit = jest.fn();
    render(<MockUserForm {...defaultProps} onSubmit={onSubmit} />);
    
    // Fill in fields with invalid phone
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/Phone/i), {
      target: { value: '123' },
    });
    
    const submitButton = screen.getByText(/Add User/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  test('closes form when cancel button is clicked', () => {
    const onClose = jest.fn();
    render(<MockUserForm {...defaultProps} onClose={onClose} />);
    
    const cancelButton = screen.getByText(/Cancel/i);
    fireEvent.click(cancelButton);
    
    expect(onClose).toHaveBeenCalled();
  });

  test('renders role options correctly', () => {
    render(<MockUserForm {...defaultProps} />);
    
    const roleSelect = screen.getByLabelText(/Role/i);
    fireEvent.mouseDown(roleSelect);
    
    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Super Admin/i)).toBeInTheDocument();
    expect(screen.getByText(/Taxpayer/i)).toBeInTheDocument();
    expect(screen.getByText(/Revenue Officer/i)).toBeInTheDocument();
  });

  test('renders status options correctly', () => {
    render(<MockUserForm {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText(/Status/i);
    fireEvent.mouseDown(statusSelect);
    
    expect(screen.getByText(/Active/i)).toBeInTheDocument();
    expect(screen.getByText(/Inactive/i)).toBeInTheDocument();
    expect(screen.getByText(/Suspended/i)).toBeInTheDocument();
  });
});
