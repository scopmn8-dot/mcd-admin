import { apiFetch } from '../api';
import React, { useEffect, useState } from "react";
import SheetTable from "../components/SheetTable";
import InitializeDriverSequencesButton from "../components/InitializeDriverSequencesButton";
import DriverQueueViewer from "../components/DriverQueueViewer";
import SheetMonitorButton from "../components/SheetMonitorButton";
import DriverJobCounts from "../components/DriverJobCounts";
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
/* kept Grid from @mui/material above */
import {
  DirectionsCar as DirectionsCarIcon,
  Assessment as AssessmentIcon,
  Assignment as AssignmentIcon,
  AutoMode as AutoModeIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  SwapHoriz as SwapHorizIcon,
  PlayArrow as PlayArrowIcon
} from "@mui/icons-material";

// Enhanced action card component
const ModernActionCard = React.memo(({ title, subtitle, icon, color, loading, onClick, disabled, primary = false }) => (
  <Card
    sx={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      height: 140,
      background: primary 
        ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
        : `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
      border: primary 
        ? 'none' 
        : `2px solid ${color}30`,
      position: 'relative',
      overflow: 'hidden',
      '&:hover': !disabled && {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 40px ${color}40`,
        border: primary ? 'none' : `2px solid ${color}60`,
      },
      '&:active': !disabled && {
        transform: 'translateY(-2px)',
      },
      '&::before': !primary && {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
      },
      opacity: disabled ? 0.6 : 1,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}
    onClick={!disabled ? onClick : undefined}
  >
    <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
      <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
        <Box
          sx={{
            background: primary 
              ? 'rgba(255,255,255,0.2)' 
              : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
            borderRadius: '50%',
            width: 64,
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: primary 
              ? 'none' 
              : `0 4px 20px ${color}40`,
            flexShrink: 0,
          }}
        >
          {loading ? (
            <CircularProgress size={28} sx={{ color: primary ? 'white' : 'white' }} />
          ) : (
            React.cloneElement(icon, { 
              fontSize: 'large',
              sx: { color: primary ? 'white' : 'white' }
            })
          )}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              color: primary ? 'white' : 'text.primary',
              mb: 0.5,
              fontSize: '1.1rem',
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              color: primary ? 'rgba(255,255,255,0.9)' : 'text.secondary',
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
));

// Enhanced statistics card component
const ModernStatCard = React.memo(({ title, value, icon, color, subtitle }) => (
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
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color, 
              fontSize: '2rem',
              lineHeight: 1,
              mb: 0.5,
            }}
          >
            {value}
          </Typography>
          {subtitle && (
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ 
                fontSize: '0.7rem',
                fontWeight: 500,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 20px ${color}40`,
          }}
        >
          {React.cloneElement(icon, { 
            fontSize: 'medium', 
            sx: { color: 'white' }
          })}
        </Box>
      </Stack>
    </CardContent>
  </Card>
));

export default function Drivers() {
  const theme = useTheme();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [assigningDrivers, setAssigningDrivers] = useState(false);
  const [assignDriversMsg, setAssignDriversMsg] = useState("");
  const [redistributing, setRedistributing] = useState(false);
  const [redistributeMsg, setRedistributeMsg] = useState("");

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
  const res = await apiFetch('/api/drivers');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to fetch drivers");
      }
      const data = await res.json();
      setDrivers(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  // Dynamically get columns from first row, fallback to []
  const columns = drivers.length > 0 ? Object.keys(drivers[0]) : [];

  const handleAutoAssign = async () => {
    setBusy(true);
    setMsg("");
    try {
  const res = await apiFetch('/api/auto-cluster-assign', { method: 'POST' });
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Error");
        } else {
          const text = await res.text();
          throw new Error(text);
        }
      }
      setMsg("Auto clustering and assignment completed successfully!");
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleAssignDrivers = async () => {
    setAssigningDrivers(true);
    setAssignDriversMsg("");
    try {
  const res = await apiFetch('/api/assign-drivers-to-all', { method: 'POST' });
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Error");
        } else {
          const text = await res.text();
          throw new Error(text);
        }
      }
      const data = await res.json();
      setAssignDriversMsg(`Successfully assigned drivers to ${data.totalJobs} jobs. Stats: ${data.stats.sameRegion} same region, ${data.stats.within10Miles} within 10 miles, ${data.stats.nearestFallback} nearest fallback.`);
    } catch (e) {
      setAssignDriversMsg(`Error: ${e.message}`);
    } finally {
      setAssigningDrivers(false);
    }
  };

  const handleRedistributeJobs = async () => {
    setRedistributing(true);
    setRedistributeMsg("");
    try {
  const res = await apiFetch('/api/redistribute-jobs', { method: 'POST' });
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Error");
        } else {
          const text = await res.text();
          throw new Error(text);
        }
      }
      const data = await res.json();
      if (data.success) {
        if (data.redistributions && data.redistributions.length > 0) {
          setRedistributeMsg(`✅ Successfully redistributed ${data.redistributions.length} jobs! ${data.improvement} more drivers now have jobs. Final unassigned drivers: ${data.finalDriversWithoutJobs}`);
        } else {
          setRedistributeMsg("✅ All drivers already have at least one job assigned!");
        }
      } else {
        throw new Error(data.message || "Redistribution failed");
      }
    } catch (e) {
      setRedistributeMsg(`❌ Error: ${e.message}`);
    } finally {
      setRedistributing(false);
    }
  };

  const driverStats = {
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(d => d.status?.toLowerCase() === 'active' || !d.status).length,
    regionsCount: new Set(drivers.map(d => d.region?.toLowerCase()).filter(Boolean)).size,
    averageCapacity: drivers.length > 0 ? Math.round(drivers.reduce((sum, d) => sum + (parseInt(d.max_capacity) || 0), 0) / drivers.length) : 0,
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
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Monitor driver performance, assignments, and workload distribution
            </Typography>
          </Box>
          <Tooltip title="Refresh Driver Data">
            <span>
              <IconButton
                onClick={fetchDrivers}
                disabled={loading}
                sx={{
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {loading && (
          <LinearProgress 
            sx={{ 
              mb: 2, 
              height: 6, 
              borderRadius: 3,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
              }
            }} 
          />
        )}
      </Box>

      {/* Enhanced Driver Statistics */}
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

      {/* Driver Job Counts Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ backgroundColor: '#6366f1', width: 40, height: 40 }}>
            <AssessmentIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Real-Time Job Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor and update driver workload assignments
            </Typography>
          </Box>
        </Stack>
        <DriverJobCounts />
      </Paper>

      {/* Enhanced Action Cards */}
      <Card sx={{ mb: 4, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Box
              sx={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PlayArrowIcon sx={{ color: 'white' }} />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Driver Operations
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage driver assignments and workload distribution
              </Typography>
            </Box>
          </Stack>
          
          <Grid container spacing={3} columns={12}>
            <Grid xs={12} lg={4}>
              <ModernActionCard
                title="Auto Cluster & Assign"
                subtitle="Intelligent job clustering and driver assignment with load balancing"
                icon={<AutoModeIcon />}
                color="#6366f1"
                loading={busy}
                onClick={handleAutoAssign}
                primary={true}
              />
            </Grid>
            <Grid xs={12} lg={4}>
              <ModernActionCard
                title="Assign All Drivers"
                subtitle="Ensure every driver gets at least one job assignment"
                icon={<AssignmentIcon />}
                color="#8b5cf6"
                loading={assigningDrivers}
                onClick={handleAssignDrivers}
              />
            </Grid>
            <Grid xs={12} lg={4}>
              <ModernActionCard
                title="Redistribute Jobs"
                subtitle="Balance job distribution to ensure all drivers get at least one job"
                icon={<SwapHorizIcon />}
                color="#10b981"
                loading={redistributing}
                onClick={handleRedistributeJobs}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* System Management */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          System Management
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <InitializeDriverSequencesButton />
          <SheetMonitorButton />
          <DriverQueueViewer />
        </Stack>
      </Paper>

      {/* Status Messages */}
      {msg && (
        <Alert 
          severity={msg.toLowerCase().includes('error') ? 'error' : 'success'} 
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {msg}
        </Alert>
      )}
      {assignDriversMsg && (
        <Alert 
          severity={assignDriversMsg.includes("Successfully") ? 'success' : 'error'} 
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {assignDriversMsg}
        </Alert>
      )}
      {redistributeMsg && (
        <Alert 
          severity={redistributeMsg.includes("✅") ? 'success' : 'error'} 
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {redistributeMsg}
        </Alert>
      )}

      {/* Drivers Data Table */}
      <Card sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
            <Avatar sx={{ backgroundColor: '#10b981', width: 40, height: 40 }}>
              <DirectionsCarIcon />
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
