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
  ExpandLess as ExpandLessIcon
} from "@mui/icons-material";
import AddRowModal from "../components/AddRowModal";
// JobCompletionButton removed — complete-job flow is handled automatically
import DriverQueueViewer from "../components/DriverQueueViewer";
import DriverJobAssignments from "../components/DriverJobAssignments";

// Dynamically generate columns from the first job in the current data
function getColumns(data) {
  if (Array.isArray(data) && data.length > 0) {
    return Object.keys(data[0]);
  }
  return [];
}

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

// Compact stat card component
const CompactStatCard = React.memo(({ title, value, icon, color, loading, subtitle }) => {
  if (loading) {
    return (
      <Card sx={{ height: 80 }}>
        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box sx={{ width: '100%', height: 60, bgcolor: 'action.hover', borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card
      sx={{
        height: 80,
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        border: `1px solid ${color}20`,
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: '100%' }}>
          <Box>
            <Typography color="text.secondary" variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color, fontSize: '1.5rem' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              backgroundColor: color,
              width: 36,
              height: 36,
            }}
          >
            {React.cloneElement(icon, { fontSize: 'small' })}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
});

// Compact action button component
const CompactActionButton = React.memo(({ title, subtitle, icon, color, loading, onClick, disabled }) => (
  <Card
    sx={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      height: 70,
      '&:hover': !disabled && {
        transform: 'translateY(-1px)',
      },
      transition: 'transform 0.2s ease-in-out',
      opacity: disabled ? 0.6 : 1,
    }}
    onClick={!disabled ? onClick : undefined}
  >
    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ height: '100%' }}>
        <Avatar
          sx={{
            backgroundColor: color,
            width: 32,
            height: 32,
          }}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : React.cloneElement(icon, { fontSize: 'small' })}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
        const res = await fetch(sheet.url);
        if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`);
        
        const data = await res.json();
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
  const res = await apiFetch('/api/assign-jobs-with-sequencing', { method: 'POST' });
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

  const getCurrentData = () => {
    switch (activeTab) {
      case 0: return { data: motorway, error: errors.motorway, title: "Motorway Jobs" };
      case 1: return { data: atmoves, error: errors.atmoves, title: "AT Moves Jobs" };
      case 2: return { data: privateCustomers, error: errors.privateCustomers, title: "Private Customer Jobs" };
      case 3: return { data: null, error: null, title: "Driver Assignments" };
      default: return { data: [], error: null, title: "" };
    }
  };

  const currentData = getCurrentData();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Compact Header Section */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem' } }}>
              Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400, fontSize: '0.85rem' }}>
              Manage operations and track performance
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {/* JobCompletionButton removed */}
            <DriverQueueViewer />
            <Tooltip title="Refresh Data">
              <span>
                <IconButton
                  onClick={fetchAll}
                  disabled={loading}
                  size="small"
                  sx={{
                    backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': { backgroundColor: 'primary.dark' },
                }}
              >
                <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        </Stack>

        {loading && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ 
              mb: 1.5, 
              height: 4, 
              borderRadius: 2,
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 2,
              }
            }} 
          />
        )}
      </Box>

      {/* Compact Statistics Cards */}
      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid span={3}>
          <CompactStatCard
            title="Total Jobs"
            value={stats.totalJobs.toLocaleString()}
            icon={<LocalShippingIcon />}
            color="#6366f1"
            loading={loading}
            subtitle="Active jobs"
          />
        </Grid>
  <Grid span={3}>
          <CompactStatCard
            title="Assigned"
            value={stats.assignedJobs.toLocaleString()}
            icon={<CheckCircleIcon />}
            color="#10b981"
            loading={loading}
            subtitle={`${stats.totalJobs > 0 ? Math.round((stats.assignedJobs / stats.totalJobs) * 100) : 0}% rate`}
          />
        </Grid>
  <Grid span={3}>
          <CompactStatCard
            title="Motorway"
            value={stats.motorwayJobs.toLocaleString()}
            icon={<SpeedIcon />}
            color="#8b5cf6"
            loading={loading}
            subtitle="Long distance"
          />
        </Grid>
  <Grid span={3}>
          <CompactStatCard
            title="Private"
            value={stats.privateJobs.toLocaleString()}
            icon={<GroupIcon />}
            color="#ec4899"
            loading={loading}
            subtitle="Customers"
          />
        </Grid>
      </Grid>

      {/* Collapsible Action Buttons */}
      <Box sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            Quick Actions
          </Typography>
          <IconButton 
            size="small" 
            onClick={() => setShowActions(!showActions)}
            sx={{ ml: 'auto' }}
          >
            {showActions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
        
        <Collapse in={showActions}>
          <Grid container spacing={2} columns={12}>
            <Grid span={4}>
              <CompactActionButton
                title="Auto Cluster & Assign"
                subtitle="Cluster and assign jobs automatically"
                icon={<AutoModeIcon />}
                color="#6366f1"
                loading={autoAssigning}
                onClick={handleAutoAssign}
                disabled={activeTab === 3}
              />
            </Grid>
            <Grid span={4}>
              <CompactActionButton
                title="Assign All Drivers"
                subtitle="Assign drivers with proper sequencing"
                icon={<AssignmentIcon />}
                color="#8b5cf6"
                loading={assigningDrivers}
                onClick={handleAssignDrivers}
                disabled={activeTab === 3}
              />
            </Grid>
            <Grid span={4}>
              <CompactActionButton
                title="Add New Job"
                subtitle="Create a new delivery job"
                icon={<AddIcon />}
                color="#10b981"
                onClick={() => setAddOpen(true)}
                disabled={activeTab === 3}
              />
            </Grid>
          </Grid>
        </Collapse>
      </Box>

      {/* Compact Alerts */}
      {autoAssignMsg && (
        <Alert 
          severity={autoAssignMsg.includes("success") ? "success" : "error"} 
          sx={{ mb: 1.5, borderRadius: 2, fontSize: '0.85rem' }}
          onClose={() => setAutoAssignMsg("")}
        >
          {autoAssignMsg}
        </Alert>
      )}
      {assignDriversMsg && (
        <Alert 
          severity={assignDriversMsg.includes("Successfully") ? "success" : "error"} 
          sx={{ mb: 1.5, borderRadius: 2, fontSize: '0.85rem' }}
          onClose={() => setAssignDriversMsg("")}
        >
          {assignDriversMsg}
        </Alert>
      )}

      {/* Compact Sheet Selection */}
      <Paper 
        sx={{ 
          p: 1.5, 
          mb: 2, 
          borderRadius: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5, fontSize: '1rem' }}>
          Job Categories
        </Typography>
        <Grid container spacing={1.5} columns={12}>
          {sheetTabs.map((tab, index) => (
            <Grid span={3} key={tab.key}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  border: activeTab === index ? `2px solid ${tab.color}` : '1px solid transparent',
                  background: activeTab === index 
                    ? `linear-gradient(135deg, ${tab.color}15 0%, ${tab.color}08 100%)`
                    : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(tab.color, 0.2)}`,
                  },
                  height: 60,
                }}
                onClick={() => setActiveTab(index)}
              >
                <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} sx={{ height: '100%' }}>
                    <Avatar sx={{ backgroundColor: tab.color, width: 32, height: 32 }}>
                      {React.cloneElement(tab.icon, { fontSize: 'small' })}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {tab.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {tab.description}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Main Content with Proper Scrolling */}
      <Card sx={{ borderRadius: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 2 }}>
          {activeTab === 3 ? (
            <DriverJobAssignments />
          ) : currentData.error ? (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {currentData.error}
            </Alert>
          ) : (
            <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
              <SheetTable 
                title={currentData.title} 
                columns={getColumns(currentData.data)} 
                data={Array.isArray(currentData.data) ? currentData.data : []} 
              />
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
