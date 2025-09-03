import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Chip,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import UpdateIcon from '@mui/icons-material/Update';
import AssignmentIcon from '@mui/icons-material/Assignment';
/* kept Grid from @mui/material above */

export default function DriverJobCounts() {
  const [jobCounts, setJobCounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    totalDrivers: 0,
    driversWithJobs: 0
  });

  useEffect(() => {
    fetchJobCounts();
  }, []);

  const fetchJobCounts = async () => {
    try {
      setLoading(true);
      setError('');
      
  const response = await fetch('http://localhost:3001/api/driver-job-counts');
      if (!response.ok) {
        throw new Error('Failed to fetch job counts');
      }
      
      const data = await response.json();
      setJobCounts(data.summary || []);
      setStats({
        totalDrivers: data.totalDrivers || 0,
        driversWithJobs: data.driversWithJobs || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateJobCounts = async () => {
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      
  const response = await fetch('http://localhost:3001/api/update-driver-job-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to update job counts');
      }
      
      const data = await response.json();
      setSuccess(data.message || 'Job counts updated successfully');
      
      // Refresh the data
      await fetchJobCounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const getJobDistributionColor = (totalJobs, maxJobs) => {
    const percentage = maxJobs > 0 ? (totalJobs / maxJobs) * 100 : 0;
    if (percentage >= 80) return 'error';
    if (percentage >= 60) return 'warning';
    if (percentage >= 40) return 'info';
    return 'success';
  };

  const maxJobs = Math.max(...jobCounts.map(d => d.totalJobs), 1);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentIcon />
          Driver Job Distribution
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh Data">
            <span>
              <IconButton onClick={fetchJobCounts} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            color="primary"
            startIcon={updating ? <CircularProgress size={20} color="inherit" /> : <UpdateIcon />}
            onClick={updateJobCounts}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Update Google Sheet'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} columns={12} sx={{ mb: 3 }}>
        <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Drivers
              </Typography>
              <Typography variant="h4" component="div">
                {stats.totalDrivers}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
  <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Drivers
              </Typography>
              <Typography variant="h4" component="div" color="success.main">
                {stats.driversWithJobs}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
  <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Jobs
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                {jobCounts.reduce((sum, driver) => sum + driver.totalJobs, 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
  <Grid xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Jobs/Driver
              </Typography>
              <Typography variant="h4" component="div" color="info.main">
                {stats.driversWithJobs > 0 
                  ? (jobCounts.reduce((sum, driver) => sum + driver.totalJobs, 0) / stats.driversWithJobs).toFixed(1)
                  : '0'
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Job Counts Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Individual Driver Job Counts
          </Typography>
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Driver Name</strong></TableCell>
                    <TableCell align="center"><strong>Total Jobs</strong></TableCell>
                    <TableCell align="center"><strong>Active</strong></TableCell>
                    <TableCell align="center"><strong>Completed</strong></TableCell>
                    <TableCell align="center"><strong>Pending</strong></TableCell>
                    <TableCell><strong>Load Distribution</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobCounts.map((driver, index) => (
                    <TableRow key={driver.driverName} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {driver.driverName}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={driver.totalJobs}
                          color={getJobDistributionColor(driver.totalJobs, maxJobs)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2" 
                          color={driver.activeJobs > 0 ? 'success.main' : 'textSecondary'}
                        >
                          {driver.activeJobs}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2"
                          color={driver.completedJobs > 0 ? 'primary.main' : 'textSecondary'}
                        >
                          {driver.completedJobs}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography 
                          variant="body2"
                          color={driver.pendingJobs > 0 ? 'warning.main' : 'textSecondary'}
                        >
                          {driver.pendingJobs}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress
                            variant="determinate"
                            value={maxJobs > 0 ? (driver.totalJobs / maxJobs) * 100 : 0}
                            color={getJobDistributionColor(driver.totalJobs, maxJobs)}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                            {maxJobs > 0 ? ((driver.totalJobs / maxJobs) * 100).toFixed(1) : 0}% of max
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobCounts.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          No driver job data available
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
