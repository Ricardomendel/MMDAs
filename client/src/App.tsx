import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
  Divider,
  Switch,
  
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as RevenueIcon,
  Payment as PaymentIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  MoreVert as MoreVertIcon,
  Business as BusinessIcon,
  Assessment as AssessmentIcon
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
  // State for user management
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedUserForMenu, setSelectedUserForMenu] = useState<any>(null);

  // State for admin dashboard
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [revenueCategories, setRevenueCategories] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [revenueCategoryDialogOpen, setRevenueCategoryDialogOpen] = useState(false);
  const [newRevenueCategory, setNewRevenueCategory] = useState({
    name: '',
    description: '',
    rate: '',
    status: 'active'
  });

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

  // Enhanced throttling mechanism to prevent rapid API calls
  const [lastApiCall, setLastApiCall] = useState<{ [key: string]: number }>({});
  const [isThrottled, setIsThrottled] = useState<{ [key: string]: boolean }>({});
  
  const throttledApiCall = useCallback((key: string, callback: () => void, cooldownMs: number = 2000) => {
    const now = Date.now();
    const lastCall = lastApiCall[key] || 0;
    const throttled = isThrottled[key] || false;
    
    if (now - lastCall >= cooldownMs && !throttled) {
      setIsThrottled(prev => ({ ...prev, [key]: true }));
      setLastApiCall(prev => ({ ...prev, [key]: now }));
      
      // Execute callback
      callback();
      
      // Reset throttle after execution
      setTimeout(() => {
        setIsThrottled(prev => ({ ...prev, [key]: false }));
      }, cooldownMs);
    }
  }, [lastApiCall, isThrottled]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogin = async () => {
    if (isLoggingIn) return; // Prevent multiple simultaneous login attempts
    
    setIsLoggingIn(true);
    try {
      await dispatch(login(loginForm));
      if (!error) {
        setLoginOpen(false);
        setLoginForm({ email: '', password: '' });
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    if (user && !user.id) {
      // Only fetch profile if user exists but doesn't have an ID (indicating it's a fresh login)
      dispatch(getProfile());
    }
  }, [user, dispatch]);
  

  const handleRegister = async () => {
    if (isRegistering) return; // Prevent multiple simultaneous registration attempts
    
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
    setIsRegistering(true);
    try {
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
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogout = () => {
    if (isLoggingOut) return; // Prevent multiple simultaneous logout attempts
    
    setIsLoggingOut(true);
    try {
      dispatch(logout());
      setActiveView('dashboard');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // User management functions
  const fetchUsers = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff')) return;
    
    // Prevent multiple simultaneous calls
    if (loadingUsers) return;
    
    setLoadingUsers(true);
    try {
      console.log('Fetching users for role:', user.role);
      let response;
      if (user.role === 'staff') {
        // Staff users can only see taxpayers
        console.log('Using staff-specific users endpoint');
        response = await adminAPI.getUsersForStaff();
      } else {
        // Admin users can see all users
        console.log('Using admin users endpoint');
        response = await adminAPI.getUsers();
      }
      
      console.log('Users response:', response);
      if (response.data.success) {
        setUsers(response.data.data);
        console.log('Users set:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, loadingUsers]); // Only depend on user role, not the entire user object

  // Dashboard data functions
  const fetchDashboardStats = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    // Prevent multiple simultaneous calls
    if (loadingDashboard) return;
    
    throttledApiCall('fetchDashboardStats', async () => {
      setLoadingDashboard(true);
      try {
        const response = await adminAPI.getSystemStats();
        if (response.data.success) {
          setDashboardStats(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoadingDashboard(false);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, loadingDashboard, throttledApiCall]); // Only depend on user role, not the entire user object

  const fetchStaffDashboardStats = useCallback(async () => {
    if (!user || user.role !== 'staff') return;
    
    // Prevent multiple simultaneous calls
    if (loadingDashboard) return;
    
    setLoadingDashboard(true);
    try {
      console.log('Fetching staff dashboard stats...');
      const response = await adminAPI.getStaffDashboard();
      console.log('Staff dashboard response:', response);
      if (response.data.success) {
        // Transform the data structure to match what the frontend expects
        const transformedData = {
          pendingReports: response.data.data.summary.pendingReports,
          totalTaxpayers: response.data.data.summary.totalTaxpayers,
          activeUsers: response.data.data.summary.activeUsers,
          recentAssessments: response.data.data.summary.recentAssessments
        };
        console.log('Transformed dashboard data:', transformedData);
        setDashboardStats(transformedData);
      }
    } catch (error) {
      console.error('Error fetching staff dashboard stats:', error);
    } finally {
      setLoadingDashboard(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, loadingDashboard]); // Only depend on user role, not the entire user object

  const fetchRevenueCategories = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    throttledApiCall('fetchRevenueCategories', async () => {
      try {
        const response = await adminAPI.getRevenueCategories();
        if (response.data.success) {
          setRevenueCategories(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching revenue categories:', error);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, throttledApiCall]); // Only depend on user role, not the entire user object

  const fetchProperties = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) return;
    
    throttledApiCall('fetchProperties', async () => {
      try {
        const response = await adminAPI.getProperties();
        if (response.data.success) {
          setProperties(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, throttledApiCall]); // Only depend on user role, not the entire user object

  const fetchRecentActivities = useCallback(async () => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin' && user.role !== 'staff')) return;
    
    try {
      console.log('Fetching recent activities for role:', user.role);
      let response;
      if (user.role === 'staff') {
        // Staff users can only see taxpayer-related activities
        console.log('Using staff-specific activities endpoint');
        response = await adminAPI.getRecentActivitiesForStaff();
      } else {
        // Admin users can see all activities
        console.log('Using admin activities endpoint');
        response = await adminAPI.getRecentActivities();
      }
      
      console.log('Activities response:', response);
      if (response.data.success) {
        setRecentActivities(response.data.data);
        console.log('Activities set:', response.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role]); // Only depend on user role, not the entire user object

  const handleCreateRevenueCategory = async () => {
    try {
      const response = await adminAPI.createRevenueCategory(newRevenueCategory);
      if (response.data.success) {
        setRevenueCategoryDialogOpen(false);
        setNewRevenueCategory({ name: '', description: '', rate: '', status: 'active' });
        fetchRevenueCategories();
      }
    } catch (error) {
      console.error('Error creating revenue category:', error);
    }
  };

  const sendAuthorizationEmail = async (userId: number, type: string) => {
    try {
      const response = await adminAPI.sendAuthorizationEmail({ userId, type });
      if (response.data.success) {
        alert('Authorization email sent successfully!');
      }
    } catch (error) {
      console.error('Error sending authorization email:', error);
      alert('Failed to send authorization email');
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

  // Fetch users when user changes or when accessing user management
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin') && activeView === 'users') {
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, activeView]);

  // Fetch users when staff accesses dashboard (for accurate counts)
  useEffect(() => {
    if (user && user.role === 'staff' && activeView === 'dashboard') {
      // Only fetch once when dashboard is accessed
      fetchUsers();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, activeView]);

  // Fetch dashboard data when admin dashboard is accessed
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'super_admin') && activeView === 'dashboard') {
      fetchDashboardStats();
      fetchRevenueCategories();
      fetchProperties();
      fetchRecentActivities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, activeView]);

  // Fetch dashboard data when staff dashboard is accessed
  useEffect(() => {
    if (user && user.role === 'staff' && activeView === 'dashboard') {
      // Only fetch once when dashboard is accessed
      fetchStaffDashboardStats();
      fetchUsers();
      fetchRecentActivities();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, activeView]);

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
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      const response = await adminAPI.deleteUser(id);
      if (response.data.success) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
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
  const renderStaffDashboard = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Staff Dashboard
        </Typography>
        <Button variant="outlined" onClick={() => {
          fetchStaffDashboardStats();
          fetchUsers();
          fetchRecentActivities();
        }}>
          Refresh Data
        </Button>
      </Box>
      
      {loadingDashboard ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Reports
                  </Typography>
                  <Typography variant="h4">
                    {dashboardStats?.pendingReports?.toLocaleString() || '0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Taxpayers
                  </Typography>
                  <Typography variant="h4">
                    {loadingUsers ? '...' : users.filter(u => u.role === 'taxpayer').length.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Recent Assessments
                  </Typography>
                  <Typography variant="h4">
                    {loadingDashboard ? '...' : recentActivities.length.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {loadingUsers ? '...' : users.length.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              System Overview
            </Typography>
            <Card>
              <CardContent>
                <Typography variant="body2" color="textSecondary" align="center">
                  Staff dashboard shows key metrics for monitoring taxpayer registrations and system activity.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );

  const renderAdminDashboard = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>
      
      {loadingDashboard ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4">
                    ₵ {dashboardStats?.totalRevenue?.toLocaleString() || '0'}
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
                    ₵ {dashboardStats?.pendingPayments?.toLocaleString() || '0'}
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
                    {dashboardStats?.activeUsers?.toLocaleString() || '0'}
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
                    {dashboardStats?.totalProperties?.toLocaleString() || '0'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Recent Activities
              </Typography>
              <Button variant="outlined" onClick={fetchRecentActivities}>
                Refresh
              </Button>
            </Box>
            <Card>
              <CardContent>
                {recentActivities.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No recent activities
                  </Typography>
                ) : (
                  recentActivities.map((activity, index) => (
                    <Typography key={index} variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      • {activity.message} - {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                  ))
                )}
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Revenue Categories
              </Typography>
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={() => setRevenueCategoryDialogOpen(true)}
              >
                Add Category
              </Button>
            </Box>
            <Grid container spacing={3}>
              {revenueCategories.map((category) => (
                <Grid item xs={12} md={6} key={category.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        {category.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {category.description}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 2 }}>
                        Rate: ₵{category.rate}
                      </Typography>
                      <Chip 
                        label={category.status} 
                        color={category.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<ViewIcon />}>View Details</Button>
                      <Button size="small" startIcon={<EditIcon />}>Edit</Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom>
                Recent Properties
              </Typography>
              <Button variant="outlined" onClick={fetchProperties}>
                View All Properties
              </Button>
            </Box>
            <Card>
              <CardContent>
                {properties.length === 0 ? (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No properties found
                  </Typography>
                ) : (
                  properties.slice(0, 5).map((property) => (
                    <Box key={property.id} sx={{ mb: 2, p: 2, border: '1px solid #eee', borderRadius: 1 }}>
                      <Typography variant="subtitle1">
                        {property.property_id} - {property.address}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Owner: {property.owner_name}
                      </Typography>
                      <Chip 
                        label={property.status} 
                        color={property.status === 'active' ? 'success' : 'warning'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Box>
        </>
      )}
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
        {user?.role === 'admin' || user?.role === 'super_admin' ? (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => openUserDialog()}
          >
            Add User
          </Button>
        ) : null}
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Statistics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography variant="h4">{users.filter(u => u.role === 'taxpayer').length}</Typography>
              <Typography variant="body2" color="textSecondary">Total Taxpayers</Typography>
            </Grid>
            {user?.role === 'admin' || user?.role === 'super_admin' ? (
              <>
                <Grid item xs={12} md={4}>
                  <Typography variant="h4">{users.filter(u => u.role === 'staff').length}</Typography>
                  <Typography variant="body2" color="textSecondary">MMDA Staff</Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h4">{users.filter(u => u.role === 'admin' || u.role === 'super_admin').length}</Typography>
                  <Typography variant="body2" color="textSecondary">Administrators</Typography>
                </Grid>
              </>
            ) : (
              <Grid item xs={12} md={4}>
                <Typography variant="h4">{users.filter(u => u.role === 'taxpayer' && u.status === 'active').length}</Typography>
                <Typography variant="body2" color="textSecondary">Active Taxpayers</Typography>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          {user?.role === 'admin' || user?.role === 'super_admin' ? 'All Users' : 'Taxpayer Users'}
        </Typography>
        {loadingUsers ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Card>
            <CardContent>
              {users.filter(u => user?.role === 'admin' || user?.role === 'super_admin' ? true : u.role === 'taxpayer').length === 0 ? (
                <Typography variant="body2" color="textSecondary" align="center">
                  No users found
                </Typography>
              ) : (
                <List>
                  {users.filter(u => user?.role === 'admin' || user?.role === 'super_admin' ? true : u.role === 'taxpayer').map((userItem, index) => (
                    <React.Fragment key={userItem.id}>
                      <ListItem>
                        <ListItemText
                          primary={`${userItem.first_name} ${userItem.last_name}`}
                          secondary={
                            <Box>
                              <Typography variant="body2" color="textSecondary">
                                {userItem.email} • {userItem.phone}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                <Chip 
                                  label={userItem.role} 
                                  size="small" 
                                  color={userItem.role === 'admin' ? 'error' : userItem.role === 'staff' ? 'warning' : 'primary'}
                                  sx={{ mr: 1 }}
                                />
                                <Chip 
                                  label={userItem.status} 
                                  size="small" 
                                  color={userItem.status === 'active' ? 'success' : userItem.status === 'pending' ? 'warning' : 'default'}
                                />
                              </Box>
                            </Box>
                          }
                        />
                        <ListItemSecondaryAction>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {user?.role === 'admin' || user?.role === 'super_admin' ? (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => sendAuthorizationEmail(userItem.id, 'welcome')}
                                  title="Send Welcome Email"
                                >
                                  <EmailIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingUser(userItem);
                                    setUserDialogOpen(true);
                                  }}
                                  title="Edit User"
                                >
                                  <EditIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setUserMenuAnchor(document.getElementById(`user-menu-${userItem.id}`));
                                    setSelectedUserForMenu(userItem);
                                  }}
                                  title="More Actions"
                                >
                                  <MoreVertIcon />
                                </IconButton>
                              </>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={() => sendAuthorizationEmail(userItem.id, 'welcome')}
                                title="Send Welcome Email"
                              >
                                <EmailIcon />
                              </IconButton>
                            )}
                          </Box>
                          
                          {/* User Action Menu - Only for admin users */}
                          {(user?.role === 'admin' || user?.role === 'super_admin') && (
                            <Menu
                              id={`user-menu-${userItem.id}`}
                              anchorEl={userMenuAnchor}
                              open={Boolean(userMenuAnchor) && selectedUserForMenu?.id === userItem.id}
                              onClose={() => {
                                setUserMenuAnchor(null);
                                setSelectedUserForMenu(null);
                              }}
                            >
                              <MenuItem onClick={() => {
                                sendAuthorizationEmail(userItem.id, 'account_activation');
                                setUserMenuAnchor(null);
                                setSelectedUserForMenu(null);
                              }}>
                                <EmailIcon sx={{ mr: 1 }} />
                                Send Activation Email
                              </MenuItem>
                              <MenuItem onClick={() => {
                                sendAuthorizationEmail(userItem.id, 'password_reset');
                                setUserMenuAnchor(null);
                                setSelectedUserForMenu(null);
                              }}>
                                <EmailIcon sx={{ mr: 1 }} />
                                Send Password Reset
                              </MenuItem>
                              <Divider />
                              <MenuItem onClick={() => {
                                // Toggle user status
                                const newStatus = userItem.status === 'active' ? 'inactive' : 'active';
                                handleUpdateUser({ ...userItem, status: newStatus }, userItem.id.toString());
                                setUserMenuAnchor(null);
                                setSelectedUserForMenu(null);
                              }}>
                                <Switch 
                                  checked={userItem.status === 'active'} 
                                  size="small"
                                  sx={{ mr: 1 }}
                                />
                                {userItem.status === 'active' ? 'Deactivate' : 'Activate'}
                              </MenuItem>
                              <MenuItem 
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${userItem.first_name} ${userItem.last_name}?`)) {
                                    handleDeleteUser(userItem.id.toString());
                                  }
                                  setUserMenuAnchor(null);
                                  setSelectedUserForMenu(null);
                                }}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteIcon sx={{ mr: 1 }} />
                                Delete User
                              </MenuItem>
                            </Menu>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                      {index < users.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );

  const renderProperties = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Property Management
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Add Property
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {properties.map((property) => (
          <Grid item xs={12} md={6} lg={4} key={property.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {property.property_id}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {property.address}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Owner: {property.owner_name}
                </Typography>
                <Chip 
                  label={property.status} 
                  color={property.status === 'active' ? 'success' : 'warning'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </CardContent>
              <CardActions>
                <Button size="small" startIcon={<ViewIcon />}>View Details</Button>
                <Button size="small" startIcon={<EditIcon />}>Edit</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
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
              <Typography variant="h4" color="primary">
                ₵ {dashboardStats?.totalRevenue?.toLocaleString() || '0'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total revenue collected
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" startIcon={<ViewIcon />}>Generate Report</Button>
            </CardActions>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Statistics
              </Typography>
              <Typography variant="h4" color="secondary">
                {dashboardStats?.totalUsers || '0'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total registered users
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

  // removed unused renderTaxpayerProperties

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

  const renderSettings = () => (
    <Box>
      <Typography variant="h4" gutterBottom>
        System Settings
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Email Configuration
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Configure email settings for user notifications
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Configure Email
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Preferences
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Manage system-wide preferences and configurations
              </Typography>
              <Button variant="outlined" sx={{ mt: 2 }}>
                Manage Preferences
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderDashboard = () => {
    if (!user) return null;
    
    // Show different dashboard based on user role
    if (user.role === 'admin' || user.role === 'super_admin') {
      return renderAdminDashboard();
    } else if (user.role === 'staff') {
      return renderStaffDashboard();
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
        // Only allow admin, super_admin, and taxpayer roles to access payments
        if (user?.role === 'taxpayer') {
          return renderTaxpayerPayments();
        } else if (user?.role === 'admin' || user?.role === 'super_admin') {
          return renderPayments();
        } else {
          // Staff users - redirect to dashboard
          setActiveView('dashboard');
          return renderDashboard();
        }
      case 'users':
        return renderUsers();
      case 'reports':
        if (user?.role === 'taxpayer') {
          return renderTaxpayerHistory();
        }
        return renderReports();
      case 'properties':
        // Only allow admin and super_admin roles to access properties
        if (user?.role === 'admin' || user?.role === 'super_admin') {
          return renderProperties();
        } else {
          // Staff and taxpayer users - redirect to dashboard
          setActiveView('dashboard');
          return renderDashboard();
        }
      case 'settings':
        return renderSettings();
      case 'profile':
        return renderTaxpayerProfile();
      case 'history':
        return renderTaxpayerHistory();
      default:
        return renderDashboard();
    }
  };

  

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
              <Button 
                  color="inherit" 
                  onClick={handleLogout} 
                  startIcon={isLoggingOut ? <CircularProgress size={20} color="inherit" /> : <LogoutIcon />}
                  disabled={isLoggingOut}
                >
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" onClick={() => setLoginOpen(true)} startIcon={<LoginIcon />}>
                Login
              </Button>
              <Button variant="contained" onClick={() => setRegisterOpen(true)} disabled={isRegistering}>
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
              <ListItem button onClick={() => setActiveView('dashboard')}>
                <ListItemIcon>
                  <DashboardIcon />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItem>
              <ListItem button onClick={() => setActiveView('users')}>
                <ListItemIcon>
                  <PeopleIcon />
                </ListItemIcon>
                <ListItemText primary="User Management" />
              </ListItem>
              <ListItem button onClick={() => setActiveView('revenue')}>
                <ListItemIcon>
                  <RevenueIcon />
                </ListItemIcon>
                <ListItemText primary="Revenue Management" />
              </ListItem>
              {/* Only show Payments and Properties for admin and super_admin users */}
              {(user.role === 'admin' || user.role === 'super_admin') && (
                <>
                  <ListItem button onClick={() => setActiveView('payments')}>
                    <ListItemIcon>
                      <PaymentIcon />
                    </ListItemIcon>
                    <ListItemText primary="Payments" />
                  </ListItem>
                  <ListItem button onClick={() => setActiveView('properties')}>
                    <ListItemIcon>
                      <BusinessIcon />
                    </ListItemIcon>
                    <ListItemText primary="Properties" />
                  </ListItem>
                </>
              )}
              <ListItem button onClick={() => setActiveView('reports')}>
                <ListItemIcon>
                  <AssessmentIcon />
                </ListItemIcon>
                <ListItemText primary="Reports" />
              </ListItem>
              <ListItem button onClick={() => setActiveView('settings')}>
                <ListItemIcon>
                  <SettingsIcon />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItem>
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
          <Button 
            onClick={handleLogin} 
            variant="contained" 
            disabled={isLoggingIn}
            startIcon={isLoggingIn ? <CircularProgress size={20} /> : null}
          >
            {isLoggingIn ? 'Logging in...' : 'Login'}
          </Button>
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
          <Button 
            onClick={handleRegister} 
            variant="contained" 
            disabled={isRegistering}
            startIcon={isRegistering ? <CircularProgress size={20} /> : null}
          >
            {isRegistering ? 'Registering...' : 'Register'}
          </Button>
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

      {/* Revenue Category Dialog */}
      <Dialog open={revenueCategoryDialogOpen} onClose={() => setRevenueCategoryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {newRevenueCategory.name ? 'Edit Revenue Category' : 'Add New Revenue Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Name"
                fullWidth
                variant="outlined"
                value={newRevenueCategory.name}
                onChange={(e) => setNewRevenueCategory({ ...newRevenueCategory, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Description"
                fullWidth
                variant="outlined"
                value={newRevenueCategory.description}
                onChange={(e) => setNewRevenueCategory({ ...newRevenueCategory, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Rate (₵)"
                type="number"
                fullWidth
                variant="outlined"
                value={newRevenueCategory.rate}
                onChange={(e) => setNewRevenueCategory({ ...newRevenueCategory, rate: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                label="Status"
                fullWidth
                variant="outlined"
                value={newRevenueCategory.status}
                onChange={(e) => setNewRevenueCategory({ ...newRevenueCategory, status: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRevenueCategoryDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRevenueCategory} variant="contained">
            {newRevenueCategory.name ? 'Update Category' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;
