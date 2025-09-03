import { apiFetch } from './api';
import React, { useState, useMemo, useEffect, useRef } from "react";
import Dashboard from "./pages/Dashboard";
import Clustering from "./pages/Clustering";
import Drivers from "./pages/Drivers";
import ProcessedJobs from "./pages/ProcessedJobs";
import BatchPlans from "./pages/BatchPlans";
import Login from "./pages/Login";
import Register from "./pages/Register";
import './styles/modern.css';
import { 
  ThemeProvider, 
  createTheme,
  Box,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  LinearProgress,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Divider,
  Avatar,
  useMediaQuery,
  Tooltip,
  Fade,
  Paper,
  Stack,
  Chip,
  Menu,
  MenuItem,
  Badge
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountTree as ClusteringIcon,
  DirectionsCar as DriversIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  TrendingUp as TrendingUpIcon,
  PlayArrow as PlayArrowIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  AccountCircle as AccountCircleIcon,
  ExitToApp as LogoutIcon,
  NotificationsActive as NotificationsActiveIcon,
  LocalShipping as DeliveryIcon,
  DriveEta as CarIcon
} from "@mui/icons-material";

const drawerWidth = 280; // Increased for better visual balance

const createModernTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#00ff88' : '#00cc66',
      light: mode === 'dark' ? '#33ff99' : '#33d477',
      dark: mode === 'dark' ? '#00cc55' : '#00b355',
    },
    secondary: {
      main: mode === 'dark' ? '#88ff00' : '#66cc00',
    },
    success: {
      main: mode === 'dark' ? '#00ff88' : '#00cc66',
    },
    warning: {
      main: mode === 'dark' ? '#ffaa00' : '#ff8800',
    },
    error: {
      main: mode === 'dark' ? '#ff4444' : '#cc2222',
    },
    background: {
      default: mode === 'dark' ? '#0a0a0a' : '#f8f9fa',
      paper: mode === 'dark' ? 'rgba(20, 20, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    },
    text: {
      primary: mode === 'dark' ? '#ffffff' : '#1a1a1a',
      secondary: mode === 'dark' ? '#cccccc' : '#666666',
    },
    divider: mode === 'dark' ? 'rgba(0, 255, 136, 0.12)' : 'rgba(0, 204, 102, 0.12)',
    action: {
      hover: mode === 'dark' ? 'rgba(0, 255, 136, 0.08)' : 'rgba(0, 204, 102, 0.04)',
    },
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '-0.015em',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      letterSpacing: '-0.01em',
      lineHeight: 1.5,
    },
    body1: {
      fontWeight: 400,
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontWeight: 400,
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    caption: {
      fontWeight: 500,
      fontSize: '0.75rem',
      letterSpacing: '0.025em',
      textTransform: 'uppercase',
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 24px',
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        contained: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: mode === 'dark' ? 
            '0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)' :
            '0 4px 24px rgba(0, 0, 0, 0.06), 0 1px 3px rgba(0, 0, 0, 0.08)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.03)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: 16,
          boxShadow: mode === 'dark' ? 
            '0 2px 16px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)' :
            '0 2px 16px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'dark' ? 'rgba(15, 15, 35, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRight: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          height: 72,
          boxShadow: 'none',
          borderBottom: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(20px) saturate(180%)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          margin: '2px 0',
          '&:hover': {
            backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'transparent',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            '&:hover': {
              background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState(5); // Start with login page
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [settingsMenuAnchor, setSettingsMenuAnchor] = useState(null);
  const [notificationMenuAnchor, setNotificationMenuAnchor] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, message: "New job assignment available", time: "2 min ago", read: false },
    { id: 2, message: "Clustering completed successfully", time: "5 min ago", read: false },
    { id: 3, message: "Driver route optimized", time: "10 min ago", read: true },
  ]);
  const isMobile = useMediaQuery('(max-width:768px)');
  const isTablet = useMediaQuery('(max-width:1024px)');
  
  const theme = useMemo(() => createModernTheme(darkMode ? 'dark' : 'light'), [darkMode]);
  
  // Check authentication status on app startup
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          // Verify token with backend
          const response = await apiFetch('/api/auth/verify', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
            setCurrentUser(JSON.parse(user));
            setActiveTab(0); // Redirect to Dashboard if authenticated
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsAuthenticated(false);
            setCurrentUser(null);
            setActiveTab(5); // Redirect to login
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
          setCurrentUser(null);
          setActiveTab(5); // Redirect to login
        }
      } else {
        setActiveTab(5); // No token, redirect to login
      }
      
      setAuthLoading(false);
    };
    
    initAuth();
  }, []);
  
  // Auto-collapse drawer on tablet/mobile
  React.useEffect(() => {
    if (isTablet && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [isTablet]);
  
  const navigationItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, index: 0 },
    { label: 'Clustering', icon: <ClusteringIcon />, index: 1 },
    { label: 'Drivers', icon: <DriversIcon />, index: 2 },
    { label: 'Processed Jobs', icon: <PlayArrowIcon />, index: 3 },
    { label: 'Batch Plans', icon: <TrendingUpIcon />, index: 4 },
    ...(isAuthenticated 
      ? [{ label: 'Logout', icon: <LogoutIcon />, index: 7 }]
      : [
          { label: 'Sign in', icon: <SettingsIcon />, index: 5 },
          { label: 'Register', icon: <SettingsIcon />, index: 6 },
        ]
    ),
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setActiveTab(0); // Redirect to Dashboard
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setActiveTab(5); // Redirect to Login
  };

  const handleRegister = (user) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    setActiveTab(0); // Redirect to Dashboard
  };

  // Menu handlers
  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleSettingsMenuOpen = (event) => {
    setSettingsMenuAnchor(event.currentTarget);
  };

  const handleSettingsMenuClose = () => {
    setSettingsMenuAnchor(null);
  };

  const handleNotificationMenuOpen = (event) => {
    setNotificationMenuAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationMenuAnchor(null);
  };

  const handleNotificationRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  // Auto-run: periodically run clustering, assignment and order-id assignment
  const [autoRunEnabled, setAutoRunEnabled] = useState(true); // default active and running
  const [autoRunStatus, setAutoRunStatus] = useState('running'); // 'idle' | 'running' | 'error'
  const [lastAutoRun, setLastAutoRun] = useState(null);
  const [autoRunSteps, setAutoRunSteps] = useState({
    clustering: 'pending', // 'pending' | 'running' | 'success' | 'error'
    assignDrivers: 'pending',
  assignIds: 'pending',
  enforceSequencing: 'pending',
  });
  const autoRunRef = useRef(null);

  const runAutoSequence = async () => {
    if (autoRunRef.current?.running) return; // avoid overlapping runs
    autoRunRef.current = { running: true };
    setAutoRunStatus('running');
  setAutoRunSteps({ clustering: 'running', assignDrivers: 'pending', assignIds: 'pending', enforceSequencing: 'pending' });
    try {
      // 1) Auto cluster & assign
  const clusterRes = await apiFetch('/api/auto-cluster-assign', { method: 'POST' });
      if (!clusterRes.ok) {
        const t = await clusterRes.text();
        setAutoRunSteps(prev => ({ ...prev, clustering: 'error' }));
        throw new Error(`cluster error: ${t}`);
      }
      setAutoRunSteps(prev => ({ ...prev, clustering: 'success', assignDrivers: 'running' }));

      // 2) Assign drivers with sequencing
  const assignRes = await apiFetch('/api/assign-jobs-with-sequencing', { method: 'POST' });
      if (!assignRes.ok) {
        const t = await assignRes.text();
        setAutoRunSteps(prev => ({ ...prev, assignDrivers: 'error' }));
        throw new Error(`assign error: ${t}`);
      }
      setAutoRunSteps(prev => ({ ...prev, assignDrivers: 'success', assignIds: 'running' }));

      // 3) Auto-assign ids (job/cluster/order numbers)
  const idsRes = await apiFetch('/api/jobs/auto-assign-ids', { method: 'POST' });
      if (!idsRes.ok) {
        const t = await idsRes.text();
        setAutoRunSteps(prev => ({ ...prev, assignIds: 'error' }));
        throw new Error(`ids error: ${t}`);
      }
      setAutoRunSteps(prev => ({ ...prev, assignIds: 'success', enforceSequencing: 'running' }));

      // 4) Enforce sequencing to ensure one active job per driver
  const enforceRes = await apiFetch('/api/jobs/enforce-sequencing', { method: 'POST' });
      if (!enforceRes.ok) {
        const t = await enforceRes.text();
        setAutoRunSteps(prev => ({ ...prev, enforceSequencing: 'error' }));
        throw new Error(`enforce sequencing error: ${t}`);
      }
      setAutoRunSteps(prev => ({ ...prev, enforceSequencing: 'success' }));

      setAutoRunStatus('idle');
      setLastAutoRun(new Date());
      console.log('Auto sequence completed');
      // optionally trigger a refresh of the current view by dispatching a custom event
      window.dispatchEvent(new Event('autoRun:completed'));
    } catch (e) {
      console.error('Auto sequence failed', e);
      setAutoRunStatus('error');
    } finally {
      autoRunRef.current = { running: false };
    }
  };

  useEffect(() => {
    let id = null;
    if (autoRunEnabled) {
      // run immediately then on interval
      runAutoSequence();
      id = setInterval(() => runAutoSequence(), 30 * 1000); // 30s
    }
    return () => {
      if (id) clearInterval(id);
    };
  }, [autoRunEnabled]);

  const renderContent = () => {
    // Show loading while checking authentication
    if (authLoading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <Typography>Loading...</Typography>
        </Box>
      );
    }

    // Show login/register pages if not authenticated
    if (!isAuthenticated) {
      switch (activeTab) {
        case 5: return <Login onLogin={handleLogin} />;
        case 6: return <Register onRegister={handleRegister} />;
        default: return <Login onLogin={handleLogin} />;
      }
    }

    // Show protected pages if authenticated
    switch (activeTab) {
      case 0: return <Dashboard />;
      case 1: return <Clustering />;
      case 2: return <Drivers />;
      case 3: return <ProcessedJobs />;
      case 4: return <BatchPlans />;
      case 7: // Logout
        handleLogout();
        return null;
      default: return <Dashboard />;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
        {/* Compact App Bar */}
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: 'background.paper',
            color: 'text.primary',
            height: 72,
          }}
        >
          <Toolbar sx={{ minHeight: '72px !important', px: { xs: 2, sm: 3 } }}>
            {isAuthenticated && (
              <IconButton
                color="inherit"
                aria-label="toggle drawer"
                onClick={handleDrawerToggle}
                sx={{ 
                  mr: 2,
                  backgroundColor: 'action.hover',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                  },
                  transition: 'all 0.2s ease-in-out',
                }}
                size="medium"
              >
                {drawerOpen ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            )}
            
            <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                  borderRadius: 3,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)',
                  minWidth: 48,
                  minHeight: 48,
                }}
              >
                <Typography sx={{ 
                  color: 'white', 
                  fontSize: '1.2rem', 
                  fontWeight: 900,
                  fontFamily: '"Inter", sans-serif',
                  letterSpacing: '-1px'
                }}>
                  MCD
                </Typography>
              </Box>
              <Box>
                <Typography variant="h5" component="div" sx={{ 
                  fontWeight: 800, 
                  color: 'primary.main', 
                  fontSize: '1.5rem',
                  background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  MCD ADMIN
                </Typography>
                {!isMobile && (
                  <Typography variant="caption" color="text.secondary" sx={{ 
                    fontWeight: 500,
                    fontSize: '0.75rem',
                    letterSpacing: '0.5px',
                  }}>
                    Miles Car Delivery Administration
                  </Typography>
                )}
              </Box>
              {!isMobile && (
                <Chip 
                  label="Admin v1.0" 
                  size="small" 
                  sx={{ 
                    height: 24, 
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                    color: 'black',
                    boxShadow: '0 2px 8px rgba(0, 255, 136, 0.3)',
                  }} 
                />
              )}
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Toggle theme" arrow>
                <span>
                  <IconButton 
                    onClick={handleThemeToggle} 
                    sx={{
                      backgroundColor: 'action.hover',
                      '&:hover': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    size="medium"
                  >
                    {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </span>
              </Tooltip>
              {/* Auto-run toggle & status */}
              <Tooltip title={autoRunEnabled ? 'Auto-run is enabled' : 'Enable auto-run (every 30s)'} arrow>
                <span>
                  <IconButton
                    onClick={() => setAutoRunEnabled(!autoRunEnabled)}
                    sx={{
                      backgroundColor: autoRunEnabled ? 'success.main' : 'action.hover',
                      color: autoRunEnabled ? 'white' : 'inherit',
                      '&:hover': {
                        backgroundColor: autoRunEnabled ? 'success.dark' : 'primary.main',
                        color: 'white',
                      },
                      transition: 'all 0.2s ease-in-out',
                    }}
                    size="medium"
                  >
                    <PlayArrowIcon />
                  </IconButton>
                </span>
              </Tooltip>

              {!isMobile && (
                <Paper elevation={0} sx={{ px: 1, py: 0.5, ml: 1.5, borderRadius: 2, display: 'flex', alignItems: 'center', minWidth: 220 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, display: 'block' }}>
                        Auto Runner
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        {autoRunStatus === 'running' ? 'Running' : autoRunStatus === 'error' ? 'Error' : autoRunEnabled ? 'Active' : 'Idle'} • {lastAutoRun ? new Date(lastAutoRun).toLocaleTimeString() : '—'}
                      </Typography>
                      <Box sx={{ mt: 0.5 }}>
                        <LinearProgress variant="determinate" value={
                          autoRunStatus === 'running' ? 50 : autoRunStatus === 'error' ? 100 : autoRunEnabled ? 100 : 0
                        } sx={{ height: 6, borderRadius: 2 }} />
                      </Box>
                    </Box>
                    <Box sx={{ ml: 1, display: 'flex', gap: 1 }}>
                      <Chip label={autoRunSteps.clustering} size="small" color={autoRunSteps.clustering === 'running' ? 'info' : autoRunSteps.clustering === 'success' ? 'success' : autoRunSteps.clustering === 'error' ? 'error' : 'default'} />
                      <Chip label={autoRunSteps.assignDrivers} size="small" color={autoRunSteps.assignDrivers === 'running' ? 'info' : autoRunSteps.assignDrivers === 'success' ? 'success' : autoRunSteps.assignDrivers === 'error' ? 'error' : 'default'} />
                      <Chip label={autoRunSteps.assignIds} size="small" color={autoRunSteps.assignIds === 'running' ? 'info' : autoRunSteps.assignIds === 'success' ? 'success' : autoRunSteps.assignIds === 'error' ? 'error' : 'default'} />
                      <Chip label={autoRunSteps.enforceSequencing} size="small" color={autoRunSteps.enforceSequencing === 'running' ? 'info' : autoRunSteps.enforceSequencing === 'success' ? 'success' : autoRunSteps.enforceSequencing === 'error' ? 'error' : 'default'} />
                    </Box>
                  </Box>
                </Paper>
              )}

              {!isMobile && isAuthenticated && (
                <>
                  <Tooltip title={`${unreadNotificationCount} unread notifications`} arrow>
                    <span>
                      <IconButton 
                        onClick={handleNotificationMenuOpen}
                        sx={{
                          backgroundColor: 'action.hover',
                          '&:hover': {
                            backgroundColor: 'primary.main',
                            color: 'white',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                        size="medium"
                      >
                        <Badge badgeContent={unreadNotificationCount} color="error">
                          <NotificationsIcon />
                        </Badge>
                      </IconButton>
                    </span>
                  </Tooltip>
                  
                  <Tooltip title="Settings" arrow>
                    <span>
                      <IconButton 
                        onClick={handleSettingsMenuOpen}
                        sx={{
                          backgroundColor: 'action.hover',
                          '&:hover': {
                            backgroundColor: 'secondary.main',
                            color: 'white',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                        size="medium"
                      >
                        <SettingsIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </>
              )}
              
              {isAuthenticated && currentUser && (
                <>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                      {currentUser.username}
                    </Typography>
                    <Avatar
                      onClick={handleProfileMenuOpen}
                      sx={{
                        width: 40,
                        height: 40,
                        background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                        fontSize: '1rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 16px rgba(0, 255, 136, 0.3)',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: 'scale(1.05)',
                        },
                        transition: 'all 0.2s ease-in-out',
                      }}
                    >
                      {currentUser.username.charAt(0).toUpperCase()}
                    </Avatar>
                  </Stack>
                </>
              )}
            </Stack>
          </Toolbar>
        </AppBar>

        {/* Profile Menu */}
        <Menu
          anchorEl={profileMenuAnchor}
          open={Boolean(profileMenuAnchor)}
          onClose={handleProfileMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 200,
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <MenuItem sx={{ py: 1.5, px: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}>
                {currentUser?.username?.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {currentUser?.username}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Online
                </Typography>
              </Box>
            </Stack>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { setActiveTab(8); handleProfileMenuClose(); }} sx={{ py: 1 }}>
            <PersonIcon sx={{ mr: 2, fontSize: 20 }} />
            My Profile
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ py: 1, color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
            Logout
          </MenuItem>
        </Menu>

        {/* Settings Menu */}
        <Menu
          anchorEl={settingsMenuAnchor}
          open={Boolean(settingsMenuAnchor)}
          onClose={handleSettingsMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 180,
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <MenuItem onClick={() => { handleThemeToggle(); handleSettingsMenuClose(); }} sx={{ py: 1 }}>
            {darkMode ? <LightModeIcon sx={{ mr: 2, fontSize: 20 }} /> : <DarkModeIcon sx={{ mr: 2, fontSize: 20 }} />}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </MenuItem>
          <MenuItem onClick={() => { setActiveTab(9); handleSettingsMenuClose(); }} sx={{ py: 1 }}>
            <SettingsIcon sx={{ mr: 2, fontSize: 20 }} />
            Preferences
          </MenuItem>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notificationMenuAnchor}
          open={Boolean(notificationMenuAnchor)}
          onClose={handleNotificationMenuClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 320,
              maxHeight: 400,
              borderRadius: 3,
              backgroundColor: 'background.paper',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }
          }}
        >
          <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Notifications ({unreadNotificationCount} new)
            </Typography>
          </Box>
          {notifications.map((notification) => (
            <MenuItem 
              key={notification.id}
              onClick={() => { handleNotificationRead(notification.id); }}
              sx={{ 
                py: 1.5, 
                px: 2,
                backgroundColor: notification.read ? 'transparent' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected',
                }
              }}
            >
              <Stack spacing={0.5} sx={{ width: '100%' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Typography variant="body2" sx={{ fontWeight: notification.read ? 400 : 600 }}>
                    {notification.message}
                  </Typography>
                  {!notification.read && (
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: 'primary.main',
                      ml: 1,
                      mt: 0.5,
                      flexShrink: 0
                    }} />
                  )}
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  {notification.time}
                </Typography>
              </Stack>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem onClick={handleNotificationMenuClose} sx={{ py: 1, justifyContent: 'center' }}>
            <Typography variant="body2" color="primary.main" sx={{ fontWeight: 600 }}>
              Mark all as read
            </Typography>
          </MenuItem>
        </Menu>

        {/* Modern Sidebar - Only show for authenticated users */}
        {isAuthenticated && (
          <Drawer
            variant={isMobile ? "temporary" : "persistent"}
            open={drawerOpen}
            onClose={() => isMobile && setDrawerOpen(false)}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              '& .MuiDrawer-paper': {
                width: drawerWidth,
                boxSizing: 'border-box',
                backgroundColor: darkMode ? '#141414' : '#ffffff',
                borderRight: `1px solid ${darkMode ? 'rgba(0, 255, 136, 0.12)' : 'rgba(0, 204, 102, 0.12)'}`,
                backgroundImage: darkMode 
                  ? 'linear-gradient(180deg, rgba(0, 255, 136, 0.02) 0%, transparent 100%)'
                  : 'linear-gradient(180deg, rgba(0, 204, 102, 0.01) 0%, transparent 100%)',
              },
            }}
          >
          <Toolbar sx={{ minHeight: '72px !important' }} /> {/* Spacer for app bar */}
          
          <Box sx={{ overflow: 'auto', p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Box sx={{ 
                width: 3, 
                height: 16, 
                backgroundColor: 'primary.main', 
                borderRadius: 1 
              }} />
              <Typography variant="caption" color="text.secondary" sx={{ 
                fontWeight: 600,
                letterSpacing: '0.1em',
                fontSize: '0.8rem'
              }}>
                NAVIGATION
              </Typography>
            </Stack>
            
            <List sx={{ mb: 3 }}>
              {navigationItems.map((item) => (
                <ListItem key={item.label} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    selected={activeTab === item.index}
                    onClick={() => {
                      setActiveTab(item.index);
                      if (isMobile) setDrawerOpen(false);
                    }}
                    sx={{
                      borderRadius: 3,
                      minHeight: 56,
                      px: 3,
                      py: 1.5,
                      backgroundColor: activeTab === item.index ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                      background: activeTab === item.index ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'transparent',
                      color: activeTab === item.index ? 'black' : 'text.primary',
                      boxShadow: activeTab === item.index ? '0 4px 16px rgba(0, 255, 136, 0.3)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        backgroundColor: activeTab === item.index ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(0, 255, 136, 0.08)',
                        background: activeTab === item.index ? 'linear-gradient(135deg, #00ff88, #00cc66)' : 'rgba(0, 255, 136, 0.08)',
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'transparent',
                        background: 'linear-gradient(135deg, #00ff88, #00cc66)',
                        '&:hover': {
                          backgroundColor: 'transparent',
                          background: 'linear-gradient(135deg, #33ff99, #33d477)',
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: activeTab === item.index ? 'black' : 'text.secondary',
                        minWidth: 48,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontWeight: activeTab === item.index ? 700 : 600,
                        fontSize: '0.95rem',
                        color: activeTab === item.index ? 'black' : 'inherit',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            
            <Divider sx={{ my: 3, borderColor: darkMode ? 'rgba(0, 255, 136, 0.12)' : 'rgba(0, 204, 102, 0.12)' }} />
            
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(0, 255, 136, 0.08) 0%, rgba(136, 255, 0, 0.04) 100%)'
                  : 'linear-gradient(135deg, rgba(0, 204, 102, 0.05) 0%, rgba(102, 204, 0, 0.02) 100%)',
                border: `2px solid ${darkMode ? 'rgba(0, 255, 136, 0.2)' : 'rgba(0, 204, 102, 0.2)'}`,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(135deg, #00ff88 0%, #88ff00 100%)',
                },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1.5 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>
                  SYSTEM STATUS
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ 
                fontWeight: 700, 
                color: 'primary.main', 
                fontSize: '1rem',
                mb: 0.5,
              }}>
                All Systems Online
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                Last updated: {new Date().toLocaleTimeString()}
              </Typography>
            </Paper>
          </Box>
        </Drawer>
        )}

        {/* Enhanced Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            height: '100vh',
            overflow: 'hidden',
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: (isAuthenticated && drawerOpen && !isMobile) ? 0 : isAuthenticated ? `-${drawerWidth}px` : 0,
            display: 'flex',
            flexDirection: 'column',
            background: darkMode ? 
              'radial-gradient(ellipse at top, rgba(0, 255, 136, 0.05) 0%, transparent 70%)' :
              'radial-gradient(ellipse at top, rgba(0, 204, 102, 0.02) 0%, transparent 70%)',
          }}
        >
          <Toolbar sx={{ minHeight: '72px !important' }} /> {/* Spacer for app bar */}
          <Box 
            sx={{ 
              flexGrow: 1,
              overflow: 'auto',
              p: { xs: 2, sm: 3, md: 4 },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.divider,
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.primary.main,
                },
              },
            }}
          >
            <Fade in timeout={500}>
              <Box sx={{ height: '100%', minHeight: 0, background: theme.palette.background.default }}>
                <Box className="app-container">
                  {renderContent()}
                </Box>
              </Box>
            </Fade>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
