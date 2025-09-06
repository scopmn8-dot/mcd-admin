import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  TextField,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assignment as AssignmentIcon,
  Group as GroupIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { apiFetch } from '../api';

const ManualDriverAssignment = () => {
  const [jobs, setJobs] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBatchDialog, setShowBatchDialog] = useState(false);
  const [batchDriver, setBatchDriver] = useState('');
  const [editingJob, setEditingJob] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDriver, setFilterDriver] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Loading data from APIs...');
      
      // Load all jobs from all sheets with better error handling
      const [motorwayResponse, atmovesResponse, privateResponse, driversResponse] = await Promise.allSettled([
        apiFetch('/api/motorway'),
        apiFetch('/api/atmoves'),
        apiFetch('/api/private-customers'),
        apiFetch('/api/drivers')
      ]);

      // Process responses and handle errors
      const motorwayJobs = motorwayResponse.status === 'fulfilled' ? 
        (Array.isArray(motorwayResponse.value) ? motorwayResponse.value : []) : [];
      const atmovesJobs = atmovesResponse.status === 'fulfilled' ? 
        (Array.isArray(atmovesResponse.value) ? atmovesResponse.value : []) : [];
      const privateJobs = privateResponse.status === 'fulfilled' ? 
        (Array.isArray(privateResponse.value) ? privateResponse.value : []) : [];
      const driversData = driversResponse.status === 'fulfilled' ? 
        (Array.isArray(driversResponse.value) ? driversResponse.value : []) : [];

      // Log any failed requests
      if (motorwayResponse.status === 'rejected') {
        console.error('Motorway API failed:', motorwayResponse.reason);
      }
      if (atmovesResponse.status === 'rejected') {
        console.error('AT Moves API failed:', atmovesResponse.reason);
      }
      if (privateResponse.status === 'rejected') {
        console.error('Private Customers API failed:', privateResponse.reason);
      }
      if (driversResponse.status === 'rejected') {
        console.error('Drivers API failed:', driversResponse.reason);
        setError('Warning: Could not load drivers list. Some functionality may be limited.');
      }

      console.log('Data loaded:', {
        motorway: motorwayJobs.length,
        atmoves: atmovesJobs.length,
        private: privateJobs.length,
        drivers: driversData.length
      });

      console.log('Data loaded:', {
        motorway: motorwayJobs.length,
        atmoves: atmovesJobs.length,
        private: privateJobs.length,
        drivers: driversData.length
      });

      // Combine all jobs and add source sheet info - ensure we're working with arrays
      const allJobs = [
        ...(motorwayJobs || []).map(job => ({ ...job, sourceSheet: 'motorway', sheetName: 'Motorway' })),
        ...(atmovesJobs || []).map(job => ({ ...job, sourceSheet: 'atmoves', sheetName: 'AT Moves' })),
        ...(privateJobs || []).map(job => ({ ...job, sourceSheet: 'privateCustomers', sheetName: 'Private Customers' }))
      ];

      // Filter jobs that have job_id (processed jobs)
      const processedJobs = allJobs.filter(job => job.job_id && job.job_id.trim() !== '');

      console.log('Processed jobs:', processedJobs.length);
      
      setJobs(processedJobs);
      setDrivers(driversData || []);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleJobSelect = (jobId, checked) => {
    if (checked) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleSelectAll = () => {
    const filteredJobs = getFilteredJobs();
    if (selectedJobs.length === filteredJobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(filteredJobs.map(job => job.job_id));
    }
  };

  const handleSingleDriverChange = async (jobId, newDriver) => {
    try {
      setLoading(true);
      
      // Find the job and its source sheet
      const job = jobs.find(j => j.job_id === jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Call the new manual assignment API
      await apiFetch('/api/jobs/assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId,
          driverName: newDriver,
          sourceSheet: job.sourceSheet
        })
      });
      
      // Refresh data
      await loadData();
      setEditingJob(null);
      setSuccess(`Driver ${newDriver ? `assigned to` : 'unassigned from'} job ${jobId}`);
    } catch (err) {
      setError('Failed to update driver assignment: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDriverAssignment = async () => {
    if (selectedJobs.length === 0) {
      setError('Please select at least one job');
      return;
    }

    try {
      setLoading(true);

      // Call the new batch assignment API
      const response = await apiFetch('/api/jobs/batch-assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobIds: selectedJobs,
          driverName: batchDriver
        })
      });

      // Refresh data
      await loadData();
      
      setShowBatchDialog(false);
      setBatchDriver('');
      setSelectedJobs([]);
      
      if (response.successCount > 0) {
        setSuccess(`Successfully updated ${response.successCount} job assignments${response.emailNotificationsSent > 0 ? ` (${response.emailNotificationsSent} email notifications sent)` : ''}`);
      }
      if (response.errorCount > 0) {
        setError(`Failed to update ${response.errorCount} jobs`);
      }
    } catch (err) {
      setError('Batch assignment failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredJobs = () => {
    return jobs.filter(job => {
      const statusMatch = filterStatus === 'all' || 
        (filterStatus === 'assigned' && job.selected_driver) ||
        (filterStatus === 'unassigned' && !job.selected_driver);
      
      const driverMatch = filterDriver === 'all' || job.selected_driver === filterDriver;
      
      return statusMatch && driverMatch;
    });
  };

  const getDriverJobCount = (driverName) => {
    return jobs.filter(job => job.selected_driver === driverName).length;
  };

  const getStatusColor = (job) => {
    if (!job.selected_driver) return 'error';
    if (job.job_status === 'completed') return 'success';
    if (job.job_status === 'active') return 'info';
    return 'warning';
  };

  const getStatusText = (job) => {
    if (!job.selected_driver) return 'Unassigned';
    if (job.job_status === 'completed') return 'Completed';
    if (job.job_status === 'active') return 'Active';
    return 'Pending';
  };

  const filteredJobs = getFilteredJobs();

  if (loading && jobs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        <AssignmentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Manual Driver Assignment
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Jobs
              </Typography>
              <Typography variant="h5">
                {jobs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Assigned Jobs
              </Typography>
              <Typography variant="h5" color="success.main">
                {jobs.filter(job => job.selected_driver).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Unassigned Jobs
              </Typography>
              <Typography variant="h5" color="error.main">
                {jobs.filter(job => !job.selected_driver).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Selected Jobs
              </Typography>
              <Typography variant="h5" color="primary.main">
                {selectedJobs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Control Panel */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
              >
                <MenuItem value="all">All Jobs</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="unassigned">Unassigned</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Driver</InputLabel>
              <Select
                value={filterDriver}
                onChange={(e) => setFilterDriver(e.target.value)}
                label="Filter by Driver"
              >
                <MenuItem value="all">All Drivers</MenuItem>
                {drivers.map(driver => (
                  <MenuItem key={driver.Name} value={driver.Name}>
                    {driver.Name} ({getDriverJobCount(driver.Name)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button
                variant="outlined"
                size="small"
                onClick={handleSelectAll}
                startIcon={<FilterIcon />}
              >
                {selectedJobs.length === filteredJobs.length ? 'Deselect All' : 'Select All Filtered'}
              </Button>
              <Button
                variant="contained"
                size="small"
                onClick={() => setShowBatchDialog(true)}
                disabled={selectedJobs.length === 0}
                startIcon={<GroupIcon />}
              >
                Batch Assign ({selectedJobs.length})
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={loadData}
                disabled={loading}
              >
                Refresh Data
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedJobs.length > 0 && selectedJobs.length < filteredJobs.length}
                  checked={filteredJobs.length > 0 && selectedJobs.length === filteredJobs.length}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell>Job ID</TableCell>
              <TableCell>Sheet</TableCell>
              <TableCell>VRM</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Collection</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Current Driver</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order #</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow
                key={job.job_id}
                selected={selectedJobs.includes(job.job_id)}
                hover
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedJobs.includes(job.job_id)}
                    onChange={(e) => handleJobSelect(job.job_id, e.target.checked)}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {job.job_id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={job.sheetName}
                    size="small"
                    color={job.sourceSheet === 'motorway' ? 'primary' : job.sourceSheet === 'atmoves' ? 'secondary' : 'default'}
                  />
                </TableCell>
                <TableCell>{job.VRM || job.vrm || 'N/A'}</TableCell>
                <TableCell>{job.customer_name || job.Customer || 'N/A'}</TableCell>
                <TableCell>{job.collection_postcode || 'N/A'}</TableCell>
                <TableCell>{job.delivery_postcode || 'N/A'}</TableCell>
                <TableCell>
                  {editingJob === job.job_id ? (
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <Select
                        value={job.selected_driver || ''}
                        onChange={(e) => handleSingleDriverChange(job.job_id, e.target.value)}
                        displayEmpty
                      >
                        <MenuItem value="">
                          <em>Unassigned</em>
                        </MenuItem>
                        {drivers.map(driver => (
                          <MenuItem key={driver.Name} value={driver.Name}>
                            {driver.Name} ({getDriverJobCount(driver.Name)})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2">
                        {job.selected_driver || 'Unassigned'}
                      </Typography>
                      <Tooltip title="Change Driver">
                        <IconButton
                          size="small"
                          onClick={() => setEditingJob(job.job_id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusText(job)}
                    size="small"
                    color={getStatusColor(job)}
                  />
                </TableCell>
                <TableCell>{job.order_no || job.driver_order_sequence || 'N/A'}</TableCell>
                <TableCell>
                  {editingJob === job.job_id ? (
                    <IconButton
                      size="small"
                      onClick={() => setEditingJob(null)}
                    >
                      <CancelIcon fontSize="small" />
                    </IconButton>
                  ) : (
                    <IconButton
                      size="small"
                      onClick={() => setEditingJob(job.job_id)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredJobs.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography color="textSecondary">
            No jobs found matching current filters
          </Typography>
        </Box>
      )}

      {/* Batch Assignment Dialog */}
      <Dialog open={showBatchDialog} onClose={() => setShowBatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <GroupIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Batch Assign Driver
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Assign a driver to {selectedJobs.length} selected jobs
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Driver</InputLabel>
            <Select
              value={batchDriver}
              onChange={(e) => setBatchDriver(e.target.value)}
              label="Select Driver"
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>
              {drivers.map(driver => (
                <MenuItem key={driver.Name} value={driver.Name}>
                  {driver.Name} (Current: {getDriverJobCount(driver.Name)} jobs)
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
            Selected Jobs:
          </Typography>
          <Box sx={{ maxHeight: 200, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, p: 1 }}>
            {selectedJobs.map(jobId => {
              const job = jobs.find(j => j.job_id === jobId);
              return (
                <Typography key={jobId} variant="body2">
                  {jobId} - {job?.VRM || 'N/A'} ({job?.sheetName})
                </Typography>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBatchDialog(false)}>Cancel</Button>
          <Button
            onClick={handleBatchDriverAssignment}
            variant="contained"
            disabled={!batchDriver || loading}
            startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
          >
            Assign Driver
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManualDriverAssignment;
