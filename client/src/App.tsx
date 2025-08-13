import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  Container, 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as RevenueIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from './store';
import { login, logout, getProfile, register } from './store/slices/authSlice';
import LandingPage from './components/LandingPage';
import { adminAPI } from './services/api';
import UserForm from './components/UserForm'; // Added import for UserForm

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      dark: '#c51162',
    },
  },
  typography: {
    h2: {
      fontWeight: 700,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isLoading: loading, error } = useSelector((state: RootState) => state.auth);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'taxpayer'
  });

  useEffect(() => {
    if (user) {
      dispatch(getProfile());
    }
  }, [user, dispatch]);

  // Fetch users when user changes or when accessing user management
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin') && activeView === 'users') {
      fetchUsers();
    }
  }, [user, activeView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async () => {
    await dispatch(login(loginForm));
    if (!error) {
      setLoginOpen(false);
      setLoginForm({ email: '', password: '' });
    }
  };

  const handleRegister = async () => {
    // Validate required fields
    if (!registerForm.email || !registerForm.password || !registerForm.firstName || !registerForm.lastName || !registerForm.phone) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate password length
    if (registerForm.password.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    // Validate phone number format (Ghana format)
    const phoneRegex = /^(\+233|0)[0-9]{9}$/;
    if (!phoneRegex.test(registerForm.phone)) {
      alert('Please enter a valid Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)');
      return;
    }

    const userData = {
      email: registerForm.email,
      phone: registerForm.phone,
      password: registerForm.password,
      first_name: registerForm.firstName,
      last_name: registerForm.lastName,
      role: registerForm.role
    };
    
    console.log('Sending registration data:', userData);
    const result = await dispatch(register(userData));
    
    // Check if registration was successful
    if (result.meta.requestStatus === 'fulfilled') {
      setRegisterOpen(false);
      setRegisterForm({ email: '', password: '', firstName: '', lastName: '', phone: '', role: 'taxpayer' });
      alert('Registration successful! Please check your email for verification.');
    } else {
      // Show error message
      console.error('Registration failed:', result.payload);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setActiveView('dashboard');
  };

  // User management functions
  const fetchUsers = async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    setLoadingUsers(true);
    try {
      const response = await adminAPI.getUsers();
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await adminAPI.createUser(userData);
      if (response.data.success) {
        setUserDialogOpen(false);
        fetchUsers(); // Refresh the users list
        // You could add a success notification here
      }
    } catch (error) {
      console.error('Error creating user:', error);
      // You could add an error notification here
    }
  };

  const handleUpdateUser = async (userData: any, id?: string) => {
    if (!id) {
      console.error('User ID is required for update');
      return;
    }
    
    try {
      const response = await adminAPI.updateUser(id, userData);
      if (response.data.success) {
        setUserDialogOpen(false);
        setEditingUser(null);
        fetchUsers(); // Refresh the users list
        // You could add a success notification here
      }
    } catch (error) {
      console.error('Error updating user:', error);
      // You could add an error notification here
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await adminAPI.deleteUser(id);
        if (response.data.success) {
          fetchUsers(); // Refresh the users list
          // You could add a success notification here
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        // You could add an error notification here
      }
    }
  };

  const openUserDialog = (user?: any) => {
    setEditingUser(user || null);
    setUserDialogOpen(true);
  };

  const closeUserDialog = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
  };

  // Role-based dashboard rendering
  const renderAdminDashboard = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Revenue
              </Typography>
              <Typography variant="h4">
                ₵ 2,450,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Pending Payments
              </Typography>
              <Typography variant="h4">
                ₵ 180,000
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4">
                1,250
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Properties
              </Typography>
              <Typography variant="h4">
                890
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Recent Activities
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              • New property assessment submitted - 2 hours ago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Payment received for Property ID: PRP-2024-001 - 4 hours ago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • User registration: John Doe - 6 hours ago
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );

  const renderTaxpayerDashboard = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Tax Dashboard
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                My Properties
              </Typography>
              <Typography variant="h4">
                2
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Registered properties
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Outstanding Tax
              </Typography>
              <Typography variant="h4">
                ₵ 450
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Due this month
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Last Payment
              </Typography>
              <Typography variant="h4">
                ₵ 200
              </Typography>
              <Typography variant="body2" color="textSecondary">
                2 weeks ago
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6} lg={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tax History
              </Typography>
              <Typography variant="h4">
                12
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Payments made
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          My Recent Activities
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary">
              • Property tax payment made - 2 weeks ago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Property assessment updated - 1 month ago
            </Typography>
            <Typography variant="body2" color="textSecondary">
              • Account verification completed - 2 months ago
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Button variant="contained" fullWidth startIcon={<PaymentIcon />}>
              Pay Tax
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="outlined" fullWidth startIcon={<ViewIcon />}>
              View Tax History
            </Button>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button variant="outlined" fullWidth startIcon={<SettingsIcon />}>
              Update Profile
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );

  const renderRevenueManagement = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Revenue Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Revenue Category
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Property Tax
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Annual property tax collection
              </Typography>
              <Typography variant="h5" sx={{ mt: 2 }}>
                ₵ 1,200,000
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<ViewIcon />}>View Details</Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Business License
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Business operating licenses
              </Typography>
              <Typography variant="h5" sx={{ mt: 2 }}>
                ₵ 450,000
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<ViewIcon />}>View Details</Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderPayments = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment Processing
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Payment Methods
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" fullWidth>
                Mobile Money
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" fullWidth>
                Bank Transfer
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" fullWidth>
                Cash Payment
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );

  const renderUsers = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          User Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => openUserDialog()}
        >
          Add User
        </Button>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Typography variant="h4">{users.length}</Typography>
              <Typography variant="body2" color="textSecondary">Total Users</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h4">{users.filter(u => u.role === 'taxpayer').length}</Typography>
              <Typography variant="body2" color="textSecondary">Taxpayers</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h4">{users.filter(u => u.role === 'staff').length}</Typography>
              <Typography variant="body2" color="textSecondary">MMDA Staff</Typography>
            </Grid>
            <Grid item xs={12} md={3}>
              <Typography variant="h4">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</Typography>
              <Typography variant="body2" color="textSecondary">Administrators</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          All Users
        </Typography>
        {loadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card>
            <CardContent>
              {users.length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center">
                  No users found
                </Typography>
              ) : (
                <Box>
                  {users.map((userItem) => (
                    <Box 
                      key={userItem.id} 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        py: 2, 
                        borderBottom: '1px solid #eee',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box>
                        <Typography variant="body1">
                          {userItem.first_name} {userItem.last_name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {userItem.email} • {userItem.role} • {userItem.status}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined"
                          onClick={() => openUserDialog(userItem)}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error"
                          onClick={() => handleDeleteUser(userItem.id)}
                          disabled={userItem.id === (user?.id || 0)}
                        >
                          Delete
                        </Button>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );

  const renderReports = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Reports & Analytics
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Report
              </Typography>
              <Button variant="contained" fullWidth>
                Generate Report
              </Button>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Analytics
              </Typography>
              <Button variant="contained" fullWidth>
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTaxpayerProperties = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Properties
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Residential Property
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Address: 123 Main Street, Accra
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Property ID: PRP-2024-001
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: 'error.main' }}>
                Outstanding Tax: ₵ 250
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" startIcon={<PaymentIcon />}>
                Pay Tax
              </Button>
              <Button size="small" startIcon={<ViewIcon />}>
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Commercial Property
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Address: 456 Business Ave, Accra
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Property ID: PRP-2024-002
              </Typography>
              <Typography variant="h6" sx={{ mt: 2, color: 'error.main' }}>
                Outstanding Tax: ₵ 200
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" startIcon={<PaymentIcon />}>
                Pay Tax
              </Button>
              <Button size="small" startIcon={<ViewIcon />}>
                View Details
              </Button>
            </CardActions>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTaxpayerPayments = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Tax Payments
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Make Payment
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Select a property and payment method
              </Typography>
              <Button variant="contained" fullWidth startIcon={<PaymentIcon />}>
                Pay Property Tax
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Methods
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Button variant="outlined" fullWidth>
                    Mobile Money
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="outlined" fullWidth>
                    Bank Transfer
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="outlined" fullWidth>
                    Card Payment
                  </Button>
                </Grid>
                <Grid item xs={6}>
                  <Button variant="outlined" fullWidth>
                    Cash
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTaxpayerHistory = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Payment History
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Payments
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
              <Box>
                <Typography variant="body1">Property Tax - PRP-2024-001</Typography>
                <Typography variant="body2" color="textSecondary">2 weeks ago</Typography>
              </Box>
              <Typography variant="h6" color="success.main">₵ 200</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid #eee' }}>
              <Box>
                <Typography variant="body1">Property Tax - PRP-2024-002</Typography>
                <Typography variant="body2" color="textSecondary">1 month ago</Typography>
              </Box>
              <Typography variant="h6" color="success.main">₵ 150</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
              <Box>
                <Typography variant="body1">Property Tax - PRP-2024-001</Typography>
                <Typography variant="body2" color="textSecondary">2 months ago</Typography>
              </Box>
              <Typography variant="h6" color="success.main">₵ 200</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );

  const renderTaxpayerProfile = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Name:</strong> {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Phone:</strong> {user?.phone || 'Not provided'}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Role:</strong> {user?.role}
                </Typography>
              </Box>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained">
                Edit Profile
              </Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Status
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  <strong>Status:</strong> 
                  <span style={{ color: user?.status === 'active' ? 'green' : 'orange' }}>
                    {user?.status}
                  </span>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Email Verified:</strong> 
                  <span style={{ color: user?.email_verified ? 'green' : 'red' }}>
                    {user?.email_verified ? 'Yes' : 'No'}
                  </span>
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Member Since:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDashboard = () => {
    if (!user) return null;
    
    // Show different dashboard based on user role
    if (user.role === 'admin' || user.role === 'staff' || user.role === 'super_admin') {
      return renderAdminDashboard();
    } else {
      return renderTaxpayerDashboard();
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboard();
      case 'revenue':
        return renderRevenueManagement();
      case 'payments':
        if (user?.role === 'taxpayer') {
          return renderTaxpayerPayments();
        }
        return renderPayments();
      case 'users':
        return renderUsers();
      case 'reports':
        if (user?.role === 'taxpayer') {
          return renderTaxpayerHistory();
        }
        return renderReports();
      case 'properties':
        return renderTaxpayerProperties();
      case 'history':
        return renderTaxpayerHistory();
      case 'profile':
        return renderTaxpayerProfile();
      default:
        return renderDashboard();
    }
  };

  const getMenuItems = () => {
    if (!user) return [];
    
    if (user.role === 'admin' || user.role === 'staff' || user.role === 'super_admin') {
      // Admin/Staff menu items
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
        { text: 'Revenue Management', icon: <RevenueIcon />, view: 'revenue' },
        { text: 'Payments', icon: <PaymentIcon />, view: 'payments' },
        { text: 'User Management', icon: <PeopleIcon />, view: 'users' },
        { text: 'Reports', icon: <ReportsIcon />, view: 'reports' },
        { text: 'Settings', icon: <SettingsIcon />, view: 'settings' },
      ];
    } else {
      // Taxpayer menu items
      return [
        { text: 'Dashboard', icon: <DashboardIcon />, view: 'dashboard' },
        { text: 'My Properties', icon: <ViewIcon />, view: 'properties' },
        { text: 'Tax Payments', icon: <PaymentIcon />, view: 'payments' },
        { text: 'Payment History', icon: <ReportsIcon />, view: 'history' },
        { text: 'Profile', icon: <SettingsIcon />, view: 'profile' },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          {user && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MMDA Revenue System
          </Typography>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                             <Typography variant="body2">
                 Welcome, {user.first_name || user.email}
               </Typography>
              <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
                Logout
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={() => setLoginOpen(true)} startIcon={<LoginIcon />}>
                Login
              </Button>
              <Button variant="contained" onClick={() => setRegisterOpen(true)}>
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {user && (
        <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <Box sx={{ width: 250 }} role="presentation">
            <List>
              {menuItems.map((item) => (
                <ListItem 
                  button 
                  key={item.text}
                  onClick={() => {
                    setActiveView(item.view);
                    setDrawerOpen(false);
                  }}
                  selected={activeView === item.view}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
      )}

      {loading ? (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        </Container>
      ) : user ? (
        <Container maxWidth="lg" sx={{ mt: 3, mb: 3 }}>
          {renderContent()}
        </Container>
      ) : (
        <LandingPage onLogin={() => setLoginOpen(true)} onRegister={() => setRegisterOpen(true)} />
      )}

      {/* Login Dialog */}
      <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Login</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={loginForm.email}
            onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={loginForm.password}
            onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          />
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginOpen(false)}>Cancel</Button>
          <Button onClick={handleLogin} variant="contained">Login</Button>
        </DialogActions>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={registerOpen} onClose={() => setRegisterOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Register</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="First Name"
                fullWidth
                variant="outlined"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Last Name"
                fullWidth
                variant="outlined"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
              />
            </Grid>
                         <Grid item xs={12}>
               <TextField
                 margin="dense"
                 label="Phone"
                 fullWidth
                 variant="outlined"
                 value={registerForm.phone}
                 onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                 helperText="Enter Ghana phone number (e.g., +233XXXXXXXXX or 0XXXXXXXXX)"
                 placeholder="+233XXXXXXXXX"
               />
             </Grid>
                         <Grid item xs={12}>
               <TextField
                 margin="dense"
                 label="Password"
                 type="password"
                 fullWidth
                 variant="outlined"
                 value={registerForm.password}
                 onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                 helperText="Password must be at least 8 characters long"
               />
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegisterOpen(false)}>Cancel</Button>
          <Button onClick={handleRegister} variant="contained">Register</Button>
        </DialogActions>
      </Dialog>

      {/* User Management Dialog */}
      <Dialog open={userDialogOpen} onClose={closeUserDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <UserForm 
            user={editingUser} 
            onSubmit={editingUser ? handleUpdateUser : handleCreateUser}
            onCancel={closeUserDialog}
          />
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
