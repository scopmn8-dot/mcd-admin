import { apiFetch } from '../api';
import React, { useEffect, useState } from "react";
import SheetTable from "../components/SheetTable";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
  Stack,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  alpha,
  CircularProgress
} from "@mui/material";
import {
  DirectionsCar as DirectionsCarIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  AutoMode as AutoModeIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  CheckCircle as CheckCircleIcon,
  LocationOn as LocationOnIcon,
  Speed as SpeedIcon
} from "@mui/icons-material";

const columns = [
  "Name", "Phone", "Email", "postcode", "region", "availability", "MaxPerDay", 
  "Active Jobs", "Total Jobs", "Completed Jobs", "Pending Jobs"
];

// Modern stat card component
const ModernStatCard = ({ title, value, icon, color, loading, subtitle, trend }) => {
  const theme = useTheme();
  
  if (loading) {
    return (
      <Card sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={44} />
      </Card>
    );
  }
  
  return (
    <Card
      sx={{
        height: 140,
        background: `linear-gradient(135deg, ${color}10 0%, ${color}05 100%)`,
        border: `2px solid ${color}20`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 8px 32px ${color}40`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
        },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
          <Box sx={{ flex: 1 }}>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontWeight: 700,
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                mb: 1,
                display: 'block',
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 800,
                color: color,
                fontSize: '2.5rem',
                lineHeight: 1,
                mb: 0.5,
              }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
            {subtitle && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ 
                  fontSize: '0.8rem',
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            width: 64,
            height: 64,
            borderRadius: 3,
            background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
            color: color,
          }}>
            {React.cloneElement(icon, { sx: { fontSize: '2rem' } })}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function Drivers() {
  const theme = useTheme();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [redistributing, setRedistributing] = useState(false);
  const [redistributeMsg, setRedistributeMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/drivers');
      
      if (response.ok) {
        const data = await response.json();
        console.log('Drivers API response:', data);
        setDrivers(data);
        setError('');
      } else {
        const errorText = await response.text();
        console.error('Drivers API error:', errorText);
        throw new Error(`Failed to fetch drivers: ${errorText}`);
      }
    } catch (err) {
      console.error('Drivers fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testDriversAPI = async () => {
    try {
      setDebugInfo('Testing...');
      
      // Test 1: Check available sheets
      const sheetsResponse = await apiFetch('/api/sheets');
      const sheetsData = sheetsResponse.ok ? await sheetsResponse.json() : null;
      
      // Test 2: Test different driver sheet names
      const testResponse = await apiFetch('/api/test-drivers');
      const testData = testResponse.ok ? await testResponse.json() : null;
      
      // Test 3: Try drivers API again
      const driversResponse = await apiFetch('/api/drivers');
      const driversData = driversResponse.ok ? await driversResponse.json() : await driversResponse.text();
      
      setDebugInfo({
        availableSheets: sheetsData,
        testResults: testData,
        driversResult: driversData,
        driversSuccess: driversResponse.ok
      });
      
    } catch (err) {
      setDebugInfo({ error: err.message });
    }
  };

  const handleRedistributeJobs = async () => {
    try {
      setRedistributing(true);
      setRedistributeMsg('');
      
      const response = await apiFetch('/api/jobs/redistribute', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setRedistributeMsg(`✅ Successfully redistributed ${data.jobsReassigned || 0} jobs across ${data.driversAffected || 0} drivers.`);
        fetchDrivers(); // Refresh data
      } else {
        throw new Error('Failed to redistribute jobs');
      }
    } catch (e) {
      setRedistributeMsg(`❌ Error: ${e.message}`);
    } finally {
      setRedistributing(false);
    }
  };

  const driverStats = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.availability?.toLowerCase() === 'available' || !d.availability).length,
    regionsCount: new Set(drivers.map(d => d.region?.toLowerCase()).filter(Boolean)).size,
    averageCapacity: drivers.length > 0 ? Math.round(drivers.reduce((sum, d) => sum + (parseInt(d.MaxPerDay) || 0), 0) / drivers.length) : 0,
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>
              Driver Management
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              Manage your delivery team and job assignments
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Tooltip title="Debug Drivers API" arrow>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<AssessmentIcon />}
                  onClick={testDriversAPI}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                  }}
                >
                  Debug API
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Redistribute Jobs" arrow>
              <span>
                <Button
                  variant="contained"
                  startIcon={redistributing ? <CircularProgress size={20} /> : <AutoModeIcon />}
                  onClick={handleRedistributeJobs}
                  disabled={redistributing || loading}
                  sx={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                    boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                    borderRadius: 3,
                    px: 3,
                    py: 1.5,
                    fontWeight: 600,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                      boxShadow: '0 6px 20px rgba(139, 92, 246, 0.4)',
                    }
                  }}
                >
                  {redistributing ? 'Redistributing...' : 'Redistribute Jobs'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Refresh Data" arrow>
              <span>
                <IconButton
                  onClick={fetchDrivers}
                  disabled={loading}
                  sx={{
                    backgroundColor: 'action.hover',
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    },
                    width: 48,
                    height: 48,
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {/* Alert Messages */}
        {redistributeMsg && (
          <Alert 
            severity={redistributeMsg.includes("✅") ? "success" : "error"} 
            sx={{ mb: 2, borderRadius: 3 }}
            onClose={() => setRedistributeMsg("")}
          >
            {redistributeMsg}
          </Alert>
        )}

        {/* Debug Information */}
        {debugInfo && (
          <Paper 
            sx={{ 
              p: 3, 
              mb: 2, 
              borderRadius: 3,
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
              🔍 Debug Information
            </Typography>
            <pre style={{ 
              fontSize: '12px', 
              overflow: 'auto', 
              maxHeight: '400px',
              backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f5f5f5',
              padding: '16px',
              borderRadius: '8px',
              margin: 0
            }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={() => setDebugInfo(null)}
              sx={{ mt: 2 }}
            >
              Clear Debug Info
            </Button>
          </Paper>
        )}
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} columns={12} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Total Drivers"
            value={driverStats.totalDrivers}
            icon={<GroupIcon />}
            color="#6366f1"
            subtitle="Registered drivers"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Active Drivers"
            value={driverStats.activeDrivers}
            icon={<CheckCircleIcon />}
            color="#10b981"
            subtitle={`${driverStats.totalDrivers > 0 ? Math.round((driverStats.activeDrivers / driverStats.totalDrivers) * 100) : 0}% active`}
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Coverage Regions"
            value={driverStats.regionsCount}
            icon={<LocationOnIcon />}
            color="#8b5cf6"
            subtitle="Geographic coverage"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <ModernStatCard
            title="Avg Capacity"
            value={driverStats.averageCapacity}
            icon={<DirectionsCarIcon />}
            color="#ec4899"
            subtitle="Jobs per driver"
          />
        </Grid>
      </Grid>

      {/* Driver Directory */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ backgroundColor: '#6366f1', width: 40, height: 40 }}>
              <AssessmentIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Driver Directory
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Complete driver information and contact details
              </Typography>
            </Box>
          </Stack>
          
          {error ? (
            <Alert severity="error" sx={{ borderRadius: 3 }}>
              {error}
            </Alert>
          ) : (
            <SheetTable 
              title="Drivers" 
              columns={columns} 
              data={drivers} 
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
