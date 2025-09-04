import React, { useEffect, useState } from "react";
import SheetTable from "../components/SheetTable";
import { apiFetch } from "../api";
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
  Collapse,
  Chip,
  CircularProgress,
  useMediaQuery
} from "@mui/material";
import {
  Add as AddIcon,
  AutoMode as AutoModeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  LocalShipping as LocalShippingIcon,
  Analytics as AnalyticsIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationOnIcon,
  Group as GroupIcon,
  Assessment as AssessmentIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DeleteSweep as DeleteSweepIcon
} from "@mui/icons-material";
import AddRowModal from "../components/AddRowModal";
// JobCompletionButton removed — complete-job flow is handled automatically
import DriverQueueViewer from "../components/DriverQueueViewer";
import DriverJobAssignments from "../components/DriverJobAssignments";
/* kept Grid from @mui/material above */

const columns = [
  "job_id", "VRM", "date_time_created", "dealer", "date_time_assigned",
  "collection_full_address", "collection_postcode", "collection_town_city",
  "collection_address_1", "collection_address_2", "collection_contact_first_name",
  "collection_contact_surname", "collection_email", "collection_phone_number",
  "preferred_seller_collection_dates", "delivery_full_address", "delivery_postcode",
  "delivery_town_city", "delivery_address_1", "delivery_address_2", "delivery_contact_first_name",
  "delivery_contact_surname", "delivery_email", "delivery_phone_number", "job_type", "distance",
  "collection_date", "delivery_date", "vehicle_year", "vehicle_gearbox", "vehicle_fuel", "vehicle_colour",
  "vehicle_vin", "vehicle_mileage", "job_stage", "job_status", "selected_driver", "cluster_id",
  "forward_return_flag", "collection_region", "delivery_region", "order_no", "driver_order_sequence", "job_active"
];

const sheetTabs = [
  { 
    label: "Motorway", 
    key: "motorway", 
    icon: <LocalShippingIcon />, 
    color: "#6366f1",
    description: "Long-distance jobs"
  },
  { 
    label: "AT Moves", 
    key: "atmoves", 
    icon: <SpeedIcon />, 
    color: "#8b5cf6",
    description: "Auction transport"
  },
  { 
    label: "Private", 
    key: "privateCustomers", 
    icon: <GroupIcon />, 
    color: "#ec4899",
    description: "Customer deliveries"
  },
  { 
    label: "Assignments", 
    key: "driverAssignments", 
    icon: <AssessmentIcon />, 
    color: "#10b981",
    description: "Driver assignments"
  },
];

// Enhanced stat card component
const ModernStatCard = React.memo(({ title, value, icon, color, loading, subtitle, trend }) => {
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
  );
});

// Enhanced action button component
const ModernActionButton = React.memo(({ title, subtitle, icon, color, loading, onClick, disabled }) => (
  <Card
    sx={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      height: 100,
      border: `2px solid ${disabled ? 'action.disabled' : color + '30'}`,
      background: disabled 
        ? 'action.hover' 
        : `linear-gradient(135deg, ${color}08 0%, ${color}04 100%)`,
      position: 'relative',
      overflow: 'hidden',
      '&:hover': !disabled && {
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 32px ${color}30`,
        border: `2px solid ${color}60`,
      },
      '&:active': !disabled && {
        transform: 'translateY(0)',
      },
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      opacity: disabled ? 0.6 : 1,
      '&::before': !disabled && {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(135deg, ${color} 0%, ${color}80 100%)`,
      },
    }}
    onClick={!disabled ? onClick : undefined}
  >
    <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
      <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
        <Box
          sx={{
            background: disabled 
              ? 'text.disabled' 
              : `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`,
            borderRadius: '50%',
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: disabled ? 'none' : `0 4px 16px ${color}40`,
            flexShrink: 0,
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : (
            React.cloneElement(icon, { 
              fontSize: 'medium',
              sx: { color: 'white' }
            })
          )}
        </Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700, 
              fontSize: '1rem',
              mb: 0.5,
              color: disabled ? 'text.disabled' : 'text.primary',
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color={disabled ? 'text.disabled' : 'text.secondary'} 
            sx={{ 
              fontSize: '0.8rem',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            {subtitle}
          </Typography>
        </Box>
      </Stack>
    </CardContent>
  </Card>
));

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [motorway, setMotorway] = useState([]);
  const [atmoves, setAtmoves] = useState([]);
  const [privateCustomers, setPrivateCustomers] = useState([]);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignMsg, setAutoAssignMsg] = useState("");
  const [assigningDrivers, setAssigningDrivers] = useState(false);
  const [assignDriversMsg, setAssignDriversMsg] = useState("");
  const [clearingJobs, setClearingJobs] = useState(false);
  const [clearJobsMsg, setClearJobsMsg] = useState("");
  const [showActions, setShowActions] = useState(!isMobile);

  const fetchAll = () => {
    setLoading(true);
    setProgress(10);
    
    const sheets = [
        { url: "/api/motorway", setter: setMotorway, key: "motorway" },
        { url: "/api/atmoves", setter: setAtmoves, key: "atmoves" },
        { url: "/api/private-customers", setter: setPrivateCustomers, key: "privateCustomers" },
    ];

    let completed = 0;
    const total = sheets.length;

    const fetchSheet = async (sheet) => {
      try {
          const res = await apiFetch(sheet.url);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
        console.log(`Fetched ${sheet.key} data:`, data.length, 'items');
        sheet.setter(data);
        setErrors(prev => ({ ...prev, [sheet.key]: null }));
      } catch (error) {
        console.error(`Error fetching ${sheet.key}:`, error);
        setErrors(prev => ({ ...prev, [sheet.key]: error.message }));
        sheet.setter([]);
      } finally {
        completed++;
        setProgress(20 + (completed / total) * 70);
        
        if (completed === total) {
          setTimeout(() => {
            setLoading(false);
            setProgress(100);
          }, 200);
        }
      }
    };

    sheets.forEach(fetchSheet);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    const handler = () => {
      // refresh data when auto-run completes
      fetchAll();
      setAutoAssignMsg('Auto-run completed: data refreshed.');
      setTimeout(() => setAutoAssignMsg(''), 6 * 1000);
    };
  window.addEventListener('autoRun:completed', handler);
  return () => window.removeEventListener('autoRun:completed', handler);
  }, []);

  // Calculate statistics
  const stats = {
    totalJobs: (motorway?.length || 0) + (atmoves?.length || 0) + (privateCustomers?.length || 0),
    motorwayJobs: motorway?.length || 0,
    atmovesJobs: atmoves?.length || 0,
    privateJobs: privateCustomers?.length || 0,
    assignedJobs: [
      ...(motorway || []),
      ...(atmoves || []),
      ...(privateCustomers || [])
    ].filter(job => job.selected_driver && job.selected_driver.trim() !== '').length,
  };

  const handleAdd = async (row) => {
    const sheetKey = sheetTabs[activeTab]?.key;
    if (!sheetKey || sheetKey === 'driverAssignments') return;
    
  await apiFetch(`/api/${sheetKey}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ row })
    });
    fetchAll();
  };

  const handleAutoAssign = async () => {
    setAutoAssigning(true);
    setAutoAssignMsg("");
    try {
  const res = await apiFetch("/api/auto-cluster-assign", { method: "POST" });
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
      setAutoAssignMsg("Clustering and assignment completed successfully.");
      fetchAll();
    } catch (e) {
      setAutoAssignMsg(e.message);
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleAssignDrivers = async () => {
    setAssigningDrivers(true);
    setAssignDriversMsg("");
    try {
  const res = await apiFetch("/api/assign-jobs-with-sequencing", { method: "POST" });
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
      setAssignDriversMsg(`Successfully assigned ${data.jobsAssigned || 0} jobs to ${data.driversAffected || 0} drivers with proper sequencing.`);
      fetchAll();
    } catch (e) {
      setAssignDriversMsg(e.message);
    } finally {
      setAssigningDrivers(false);
    }
  };

  const handleClearAllJobs = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete ALL jobs from ALL sheets!\n\nThis action cannot be undone. Are you absolutely sure you want to continue?')) {
      return;
    }
    
    setClearingJobs(true);
    setClearJobsMsg("");
    try {
      const token = localStorage.getItem('token');
      const res = await apiFetch("/api/jobs/clear-all", { 
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        if (contentType && contentType.includes("application/json")) {
          const err = await res.json();
          throw new Error(err.error || "Error clearing jobs");
        } else {
          const text = await res.text();
          throw new Error(text);
        }
      }
      const data = await res.json();
      setClearJobsMsg(`Successfully cleared ${data.totalRowsCleared} jobs from ${data.sheetsCleared} sheets in ${data.timeSpent.toFixed(2)} seconds.`);
      fetchAll(); // Refresh all data
    } catch (e) {
      setClearJobsMsg(`Error: ${e.message}`);
    } finally {
      setClearingJobs(false);
    }
  };

  const getCurrentData = () => {
    const result = (() => {
      switch (activeTab) {
        case 0: return { data: motorway, error: errors.motorway, title: "Motorway Jobs" };
        case 1: return { data: atmoves, error: errors.atmoves, title: "AT Moves Jobs" };
        case 2: return { data: privateCustomers, error: errors.privateCustomers, title: "Private Customer Jobs" };
        case 3: return { data: null, error: null, title: "Driver Assignments" };
        default: return { data: [], error: null, title: "" };
      }
    })();
    console.log(`getCurrentData for tab ${activeTab}:`, result);
    return result;
  };

  const currentData = getCurrentData();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Refined Header / Hero */}
      <Box sx={{ mb: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box sx={{ flex: 1, pr: { md: 4 } }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontWeight: 800, 
                mb: 1, 
                fontSize: { xs: '1.5rem', md: '2rem' },
                color: 'text.primary',
              }}
            >
              Operations Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
              Monitor and manage your logistics operations with clarity and speed.
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Chip label="Live" size="small" sx={{ backgroundColor: 'success.main', color: 'white', fontWeight: 700 }} />
              <Button variant="contained" color="primary" onClick={handleAutoAssign} disabled={autoAssigning} sx={{ borderRadius: 10 }}>
                {autoAssigning ? 'Running...' : 'Auto Cluster & Assign'}
              </Button>
              <Button variant="outlined" onClick={handleAssignDrivers} disabled={assigningDrivers} sx={{ borderRadius: 10 }}>
                {assigningDrivers ? 'Assigning...' : 'Assign Drivers'}
              </Button>
            </Stack>
          </Box>
          <Stack direction="row" spacing={2} sx={{ mt: { xs: 2, md: 0 } }}>
            <DriverQueueViewer />
            <Tooltip title="Refresh Data" arrow>
              <span>
                <IconButton onClick={fetchAll} disabled={loading} size="large" sx={{ background: 'action.hover' }}>
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {loading && (
          <Box sx={{ mb: 3 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 6, borderRadius: 3, backgroundColor: alpha(theme.palette.primary.main, 0.08) }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center', fontWeight: 500 }}>
              Loading dashboard data... {Math.round(progress)}%
            </Typography>
          </Box>
        )}
      </Box>

      {/* Enhanced Statistics Cards */}
      <Grid container spacing={3} columns={12} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} lg={3}>
          <ModernStatCard
            title="Total Jobs"
            value={stats.totalJobs.toLocaleString()}
            icon={<LocalShippingIcon />}
            color="#6366f1"
            loading={loading}
            subtitle="Active delivery jobs"
          />
        </Grid>
  <Grid xs={12} sm={6} lg={3}>
          <ModernStatCard
            title="Assigned Jobs"
            value={stats.assignedJobs.toLocaleString()}
            icon={<CheckCircleIcon />}
            color="#10b981"
            loading={loading}
            subtitle={`${stats.totalJobs > 0 ? Math.round((stats.assignedJobs / stats.totalJobs) * 100) : 0}% completion rate`}
          />
        </Grid>
  <Grid xs={12} sm={6} lg={3}>
          <ModernStatCard
            title="Motorway Jobs"
            value={stats.motorwayJobs.toLocaleString()}
            icon={<SpeedIcon />}
            color="#8b5cf6"
            loading={loading}
            subtitle="Long-distance deliveries"
          />
        </Grid>
  <Grid xs={12} sm={6} lg={3}>
          <ModernStatCard
            title="Private Jobs"
            value={stats.privateJobs.toLocaleString()}
            icon={<GroupIcon />}
            color="#ec4899"
            loading={loading}
            subtitle="Customer deliveries"
          />
        </Grid>
      </Grid>

      {/* Enhanced Action Buttons */}
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
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Automate your workflow with these powerful tools
              </Typography>
            </Box>
            <IconButton 
              size="large" 
              onClick={() => setShowActions(!showActions)}
              sx={{ 
                backgroundColor: 'action.hover',
                '&:hover': { backgroundColor: 'action.selected' }
              }}
            >
              {showActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Stack>
          
          <Collapse in={showActions} timeout={400}>
            <Grid container spacing={3} columns={12}>
              <Grid xs={12} lg={3}>
                <ModernActionButton
                  title="Auto Cluster & Assign"
                  subtitle="Automatically cluster jobs and assign them to optimal routes"
                  icon={<AutoModeIcon />}
                  color="#6366f1"
                  loading={autoAssigning}
                  onClick={handleAutoAssign}
                  disabled={activeTab === 3}
                />
              </Grid>
              <Grid xs={12} lg={3}>
                <ModernActionButton
                  title="Assign All Drivers"
                  subtitle="Distribute jobs to drivers with intelligent sequencing"
                  icon={<AssignmentIcon />}
                  color="#8b5cf6"
                  loading={assigningDrivers}
                  onClick={handleAssignDrivers}
                  disabled={activeTab === 3}
                />
              </Grid>
              <Grid xs={12} lg={3}>
                <ModernActionButton
                  title="Add New Job"
                  subtitle="Create a new delivery job with all required details"
                  icon={<AddIcon />}
                  color="#10b981"
                  onClick={() => setAddOpen(true)}
                  disabled={activeTab === 3}
                />
              </Grid>
              <Grid xs={12} lg={3}>
                <ModernActionButton
                  title="Clear All Jobs"
                  subtitle="⚠️ Permanently delete all job data from all sheets"
                  icon={<DeleteSweepIcon />}
                  color="#ef4444"
                  loading={clearingJobs}
                  onClick={handleClearAllJobs}
                  disabled={activeTab === 3}
                />
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {/* Enhanced Alerts */}
      {(autoAssignMsg || assignDriversMsg || clearJobsMsg) && (
        <Box sx={{ mb: 3 }}>
          {autoAssignMsg && (
            <Alert 
              severity={autoAssignMsg.includes("success") ? "success" : "error"} 
              sx={{ 
                mb: 2, 
                borderRadius: 3,
                fontSize: '0.95rem',
                fontWeight: 500,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
              onClose={() => setAutoAssignMsg("")}
            >
              {autoAssignMsg}
            </Alert>
          )}
          {assignDriversMsg && (
            <Alert 
              severity={assignDriversMsg.includes("Successfully") ? "success" : "error"} 
              sx={{ 
                borderRadius: 3,
                fontSize: '0.95rem',
                fontWeight: 500,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
              onClose={() => setAssignDriversMsg("")}
            >
              {assignDriversMsg}
            </Alert>
          )}
          {clearJobsMsg && (
            <Alert 
              severity={clearJobsMsg.includes("Successfully") ? "success" : "error"} 
              sx={{ 
                borderRadius: 3,
                fontSize: '0.95rem',
                fontWeight: 500,
                '& .MuiAlert-icon': {
                  fontSize: '1.5rem',
                },
              }}
              onClose={() => setClearJobsMsg("")}
            >
              {clearJobsMsg}
            </Alert>
          )}
        </Box>
      )}

      {/* Enhanced Job Categories */}
      <Card sx={{ mb: 3, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
            Job Categories
          </Typography>
          <Grid container spacing={3}>
            {sheetTabs.map((tab, index) => (
              <Grid xs={12} sm={6} lg={3} key={tab.key}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: activeTab === index 
                      ? `3px solid ${tab.color}` 
                      : '3px solid transparent',
                    background: activeTab === index 
                      ? `linear-gradient(135deg, ${tab.color}15 0%, ${tab.color}08 100%)`
                      : 'background.paper',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: `0 12px 40px ${alpha(tab.color, 0.25)}`,
                    },
                    '&::before': activeTab === index && {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}80 100%)`,
                    },
                    height: 100,
                  }}
                  onClick={() => setActiveTab(index)}
                >
                  <CardContent sx={{ p: 3, height: '100%', display: 'flex', alignItems: 'center' }}>
                    <Stack direction="row" alignItems="center" spacing={3} sx={{ width: '100%' }}>
                      <Box
                        sx={{
                          background: `linear-gradient(135deg, ${tab.color} 0%, ${tab.color}CC 100%)`,
                          borderRadius: '50%',
                          width: 48,
                          height: 48,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: `0 4px 16px ${tab.color}40`,
                          flexShrink: 0,
                        }}
                      >
                        {React.cloneElement(tab.icon, { 
                          fontSize: 'medium',
                          sx: { color: 'white' }
                        })}
                      </Box>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          fontSize: '1.1rem',
                          mb: 0.5,
                          color: activeTab === index ? tab.color : 'text.primary',
                        }}>
                          {tab.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: '0.85rem',
                          fontWeight: 500,
                        }}>
                          {tab.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced Main Content */}
      <Card sx={{ borderRadius: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardContent sx={{ 
          flexGrow: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          overflow: 'hidden', 
          p: 0,
        }}>
          {activeTab === 3 ? (
            <Box sx={{ p: 3 }}>
              <DriverJobAssignments />
            </Box>
          ) : currentData.error ? (
            <Box sx={{ p: 3 }}>
              <Alert 
                severity="error" 
                sx={{ 
                  borderRadius: 3,
                  fontSize: '1rem',
                  '& .MuiAlert-icon': {
                    fontSize: '1.5rem',
                  },
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>
                  Error Loading Data
                </Typography>
                {currentData.error}
              </Alert>
            </Box>
          ) : (
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ 
                p: 3, 
                borderBottom: '1px solid', 
                borderColor: 'divider',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.02) 0%, rgba(139, 92, 246, 0.01) 100%)',
              }}>
                <Typography variant="h4" sx={{ 
                  fontWeight: 700,
                  color: 'primary.main',
                  mb: 1,
                }}>
                  {currentData.title}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {Array.isArray(currentData.data) ? currentData.data.length : 0} items loaded
                </Typography>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
                <SheetTable 
                  title="" 
                  columns={columns} 
                  data={Array.isArray(currentData.data) ? currentData.data : []} 
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <AddRowModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        columns={columns}
        onSubmit={handleAdd}
      />
    </Box>
  );
}
