import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  LinearProgress,
  useTheme,
  alpha,
  Fab,
  Zoom,
  Divider
} from "@mui/material";
import {
  AccountTree as AccountTreeIcon,
  Analytics as AnalyticsIcon,
  AutoMode as AutoModeIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  PlayArrow as PlayArrowIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon
} from "@mui/icons-material";
import AutoAssignIdsButton from "../components/AutoAssignIdsButton";
import ProcessLogContainer from "../components/ProcessLogContainer";
/* using Grid imported from @mui/material above */

// Modern statistics card - optimized
const StatCard = React.memo(({ title, value, icon, color, subtitle, loading }) => {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ width: '100%', height: 80, bgcolor: 'action.hover', borderRadius: 1 }} />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
        border: `1px solid ${color}20`,
        '&:hover': {
          transform: 'translateY(-1px)',
        },
        transition: 'transform 0.2s ease-in-out',
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="text.secondary" gutterBottom variant="body2" sx={{ fontWeight: 500 }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, color, mb: 1 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              backgroundColor: color,
              width: 48,
              height: 48,
            }}
          >
            {icon}
          </Avatar>
        </Stack>
      </CardContent>
    </Card>
  );
});

// Action card component
const ActionCard = ({ title, subtitle, icon, color, onClick, loading, disabled }) => (
  <Card
    sx={{
      cursor: disabled ? 'not-allowed' : 'pointer',
      transition: 'all 0.3s ease-in-out',
      height: '100%',
      background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
      border: `1px solid ${color}30`,
      '&:hover': !disabled && {
        transform: 'translateY(-4px)',
        boxShadow: `0 12px 28px ${alpha(color, 0.4)}`,
      },
      opacity: disabled ? 0.6 : 1,
    }}
    onClick={!disabled ? onClick : undefined}
  >
    <CardContent sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar
          sx={{
            backgroundColor: color,
            width: 56,
            height: 56,
          }}
        >
          {loading ? (
            <Box
              sx={{
                width: 24,
                height: 24,
                border: '2px solid currentColor',
                borderTop: '2px solid transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            />
          ) : (
            icon
          )}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.4 }}>
            {subtitle}
          </Typography>
        </Box>
        <PlayArrowIcon sx={{ color: 'text.secondary', fontSize: 28 }} />
      </Stack>
    </CardContent>
  </Card>
);

// Cluster suggestion card
const ClusterCard = ({ cluster, index, onApprove, loading }) => {
  const theme = useTheme();
  
  return (
    <Card
      sx={{
        borderRadius: 4,
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: `0 12px 28px ${alpha('#6366f1', 0.2)}`,
        },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Cluster {index + 1}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {cluster.jobs?.length || 0} jobs in this cluster
            </Typography>
          </Box>
          <Chip
            label={`${cluster.jobs?.length || 0} Jobs`}
            color="primary"
            variant="outlined"
            icon={<AssignmentIcon />}
          />
        </Stack>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            Jobs in Cluster:
          </Typography>
          {cluster.jobs?.slice(0, 3).map((job, idx) => (
            <Typography key={idx} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              • {job.job_id || `Job ${idx + 1}`} - {job.collection_postcode} → {job.delivery_postcode}
            </Typography>
          ))}
          {cluster.jobs?.length > 3 && (
            <Typography variant="body2" color="primary.main" sx={{ fontStyle: 'italic' }}>
              +{cluster.jobs.length - 3} more jobs...
            </Typography>
          )}
        </Box>
        
        <Button
          variant="contained"
          fullWidth
          onClick={() => onApprove(cluster, index)}
          disabled={loading}
          sx={{
            borderRadius: 2,
            py: 1.5,
            background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5855eb 30%, #7c3aed 90%)',
            },
          }}
        >
          {loading ? 'Approving...' : 'Approve Cluster'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default function Clustering() {
  const theme = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [logs, setLogs] = useState([]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [eta, setEta] = useState(null);
  const [logTimer, setLogTimer] = useState(null);
  const [approvingCluster, setApprovingCluster] = useState(null);

  const fetchSuggestions = () => {
    setLoading(true);
    setError("");
  fetch("http://localhost:3001/api/clusters/suggest")
      .then(res => res.ok ? res.json() : res.json().then(e => { throw new Error(e.error || 'Error'); }))
      .then(setSuggestions)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
  const res = await fetch("http://localhost:3001/api/process-logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTimeSpent(data.timeSpent || 0);
        setEta(data.eta || null);
      }
    } catch {}
  };

  useEffect(() => {
    fetchSuggestions();
    fetchLogs();
    // Poll logs every 2s while jobs are running
    const timer = setInterval(fetchLogs, 2000);
    setLogTimer(timer);
    return () => clearInterval(timer);
  }, []);

  const handleApprove = async (cluster, idx) => {
    setError("");
    setSuccess("");
    setApprovingCluster(idx);
    
    try {
      const clusterId = `CLUSTER-${Date.now()}`;
      const jobs = cluster.jobs.map((job, i) => ({
        sheet: job.sheet || "Motorway",
        rowIndex: (job._rowIndex || 2),
        forwardReturnFlag: i === 0 ? "Forward" : "Return"
      }));
      
  const res = await fetch("http://localhost:3001/api/clusters/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobs, clusterId })
      });
      
      if (res.ok) {
        setSuccess("Cluster approved and updated in Google Sheets successfully!");
        setSuggestions(s => s.filter((_, i) => i !== idx));
      } else {
        const err = await res.json();
        setError(err.error || "Error approving cluster");
      }
    } catch (e) {
      setError("Network error: " + e.message);
    } finally {
      setApprovingCluster(null);
    }
  };

  const clusterStats = {
    totalClusters: suggestions.length,
    totalJobs: suggestions.reduce((sum, cluster) => sum + (cluster.jobs?.length || 0), 0),
    avgJobsPerCluster: suggestions.length > 0 ? Math.round(suggestions.reduce((sum, cluster) => sum + (cluster.jobs?.length || 0), 0) / suggestions.length) : 0,
    processTime: timeSpent,
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>
              Job Clustering & Analytics
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Intelligent job grouping and optimization analytics
            </Typography>
          </Box>
          <Tooltip title="Refresh Suggestions">
            <span>
              <IconButton
                onClick={fetchSuggestions}
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

      {/* Statistics Cards */}
      <Grid container spacing={3} columns={12} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Available Clusters"
            value={clusterStats.totalClusters}
            icon={<AccountTreeIcon />}
            color="#6366f1"
            subtitle="Optimization suggestions"
            loading={loading}
          />
        </Grid>
  <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Clustered Jobs"
            value={clusterStats.totalJobs}
            icon={<AssignmentIcon />}
            color="#10b981"
            subtitle="Jobs ready for grouping"
            loading={loading}
          />
        </Grid>
  <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Avg Jobs/Cluster"
            value={clusterStats.avgJobsPerCluster}
            icon={<AnalyticsIcon />}
            color="#8b5cf6"
            subtitle="Efficiency metric"
            loading={loading}
          />
        </Grid>
  <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Process Time"
            value={`${Math.floor(clusterStats.processTime / 60)}:${String(clusterStats.processTime % 60).padStart(2, '0')}`}
            icon={<ScheduleIcon />}
            color="#ec4899"
            subtitle="Runtime duration"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Process Logs Section */}
      <Paper 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 4,
          background: alpha(theme.palette.background.paper, 0.6),
          backdropFilter: 'blur(20px)',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ backgroundColor: '#6366f1', width: 40, height: 40 }}>
            <TimelineIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Real-Time Process Monitoring
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Live updates from the clustering engine
            </Typography>
          </Box>
        </Stack>
        
        <Box sx={{ mb: 3 }}>
          <AutoAssignIdsButton />
        </Box>
        
        <ProcessLogContainer logs={logs} timeSpent={timeSpent} eta={eta} />
      </Paper>

      {/* Status Messages */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setSuccess("")}
        >
          {success}
        </Alert>
      )}

      {/* Cluster Suggestions */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Avatar sx={{ backgroundColor: '#8b5cf6', width: 40, height: 40 }}>
            <AccountTreeIcon />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Clustering Suggestions
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AI-powered job grouping recommendations
            </Typography>
          </Box>
        </Stack>

        {suggestions.length === 0 && !loading && (
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              background: alpha(theme.palette.background.paper, 0.6),
            }}
          >
            <MemoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Clustering Suggestions Available
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Run the clustering algorithm to generate optimization suggestions
            </Typography>
          </Paper>
        )}

        <Grid container spacing={3}>
          {suggestions.map((cluster, index) => (
            <Grid xs={12} md={6} lg={4} key={index}>
              <ClusterCard
                cluster={cluster}
                index={index}
                onApprove={handleApprove}
                loading={approvingCluster === index}
              />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Box>
  );
}
