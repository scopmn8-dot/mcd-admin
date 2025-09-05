import { apiFetch } from '../api';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  Stack
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as ReassignIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

export default function DriverJobAssignments() {
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [error, setError] = useState('');
  const [reassignDialog, setReassignDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedNewDriver, setSelectedNewDriver] = useState('');
  const [reassigning, setReassigning] = useState(false);

  useEffect(() => {
    fetchDriverAssignments();
    fetchAvailableDrivers();
  }, []);

  const fetchAvailableDrivers = async () => {
    try {
      const response = await apiFetch('/api/drivers');
      if (response.ok) {
        const drivers = await response.json();
        setAvailableDrivers(drivers);
      }
    } catch (err) {
      console.error('Error fetching drivers:', err);
    }
  };

  const fetchDriverAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs data
      const [motorwayRes, atmovesRes, privateRes] = await Promise.all([
        apiFetch('/api/motorway'),
        apiFetch('/api/atmoves'),
        apiFetch('/api/private-customers')
      ]);

      if (!motorwayRes.ok || !atmovesRes.ok || !privateRes.ok) {
        throw new Error('Failed to fetch job data');
      }

      const [motorway, atmoves, privateCustomers] = await Promise.all([
        motorwayRes.json(),
        atmovesRes.json(),
        privateRes.json()
      ]);

      // Combine all jobs
      const allJobs = [
        ...motorway.map(job => ({ ...job, source: 'Motorway' })),
        ...atmoves.map(job => ({ ...job, source: 'AT Moves' })),
        ...privateCustomers.map(job => ({ ...job, source: 'Private Customers' }))
      ];

      // Group jobs by driver
      const driverJobsMap = {};
      
      allJobs.forEach(job => {
        if (job.selected_driver) {
          if (!driverJobsMap[job.selected_driver]) {
            driverJobsMap[job.selected_driver] = {
              driverName: job.selected_driver,
              totalJobs: 0,
              activeJobs: 0,
              completedJobs: 0,
              pendingJobs: 0,
              forwardJobs: 0,
              returnJobs: 0,
              missingPostcodes: 0,
              invalidAssignments: 0,
              jobs: []
            };
          }
          
          driverJobsMap[job.selected_driver].jobs.push(job);
          driverJobsMap[job.selected_driver].totalJobs++;
          
          // Job status tracking
          if (job.job_status === 'completed') {
            driverJobsMap[job.selected_driver].completedJobs++;
          } else if (job.job_active === 'true' || job.job_status === 'active') {
            driverJobsMap[job.selected_driver].activeJobs++;
          } else {
            driverJobsMap[job.selected_driver].pendingJobs++;
          }

          // Forward/Return flag tracking
          if (job.forward_return_flag === 'Forward') {
            driverJobsMap[job.selected_driver].forwardJobs++;
          } else if (job.forward_return_flag === 'Return') {
            driverJobsMap[job.selected_driver].returnJobs++;
          }

          // Missing postcodes tracking (violates assignment rules)
          if (!job.collection_postcode || !job.delivery_postcode) {
            driverJobsMap[job.selected_driver].missingPostcodes++;
            driverJobsMap[job.selected_driver].invalidAssignments++;
          }
        }
      });

      // Convert to array and sort jobs within each driver
      const driverList = Object.values(driverJobsMap).map(driver => ({
        ...driver,
        jobs: driver.jobs.sort((a, b) => {
          const aSeq = parseInt(a.driver_order_sequence || '999');
          const bSeq = parseInt(b.driver_order_sequence || '999');
          return aSeq - bSeq;
        })
      }));

      // Sort drivers by total jobs (descending)
      driverList.sort((a, b) => b.totalJobs - a.totalJobs);

      setDriverData(driverList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReassignJob = (job) => {
    setSelectedJob(job);
    setSelectedNewDriver('');
    setReassignDialog(true);
  };

  const handleRemoveJobFromDriver = async (job) => {
    if (!window.confirm(`Are you sure you want to remove job ${job.job_id} from ${job.selected_driver}?\n\nThis will unassign the job completely.`)) {
      return;
    }

    try {
      setReassigning(true);
      const endpoint = getJobEndpoint(job.source);
      const response = await apiFetch(`/api/${endpoint}/update/${job.job_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          selected_driver: '',
          driver_order_sequence: '',
          forward_return_flag: ''
        })
      });

      if (response.ok) {
        await fetchDriverAssignments();
      } else {
        throw new Error('Failed to remove job assignment');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setReassigning(false);
    }
  };

  const handleConfirmReassign = async () => {
    if (!selectedNewDriver || !selectedJob) return;

    try {
      setReassigning(true);
      const endpoint = getJobEndpoint(selectedJob.source);
      
      // Call enhanced assignment API that will apply the 20-mile radius and routing logic
      const response = await apiFetch('/api/assign-job-to-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          jobId: selectedJob.job_id,
          sourceSheet: endpoint,
          driverName: selectedNewDriver,
          manualOverride: true // Flag to indicate this is a manual assignment
        })
      });

      if (response.ok) {
        await fetchDriverAssignments();
        setReassignDialog(false);
        setSelectedJob(null);
        setSelectedNewDriver('');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reassign job');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setReassigning(false);
    }
  };

  const getJobEndpoint = (source) => {
    switch (source) {
      case 'Motorway': return 'motorway';
      case 'AT Moves': return 'atmoves';
      case 'Private Customers': return 'private-customers';
      default: return 'motorway';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'active': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getFlagColor = (flag) => {
    return flag === 'Forward' ? 'primary' : flag === 'Return' ? 'secondary' : 'default';
  };

  const hasIssues = (job) => {
    return !job.collection_postcode || !job.delivery_postcode;
  };

  const getDriverRegion = (driverName) => {
    const driver = availableDrivers.find(d => d.name === driverName);
    return driver?.region || 'Unknown';
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Loading driver assignments...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        <Typography variant="h6">Assignment Error</Typography>
        {error}
        <Button onClick={() => setError('')} sx={{ mt: 1 }}>
          Dismiss
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <AssignmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Driver Job Assignments
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Intelligent routing with 20-mile radius • Manual overrides available
            </Typography>
          </Box>
        </Stack>
        <Button
          startIcon={<RefreshIcon />}
          onClick={fetchDriverAssignments}
          disabled={loading}
        >
          Refresh
        </Button>
      </Stack>

      {/* Assignment Rules Info */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Assignment Rules Active:
        </Typography>
        <Typography variant="body2">
          • 20-mile radius validation • Collection/Delivery postcode required • Forward/Return routing logic • Regional optimization
        </Typography>
      </Alert>

      {driverData.length === 0 ? (
        <Alert severity="info">
          No drivers have been assigned jobs yet. Use the "Assign Drivers" button in the main dashboard to start automatic assignments.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {driverData.map((driver, index) => (
            <Grid item xs={12} key={driver.driverName}>
              <Accordion defaultExpanded={index < 3}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {driver.driverName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ({getDriverRegion(driver.driverName)})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip 
                        label={`${driver.totalJobs} total`} 
                        color="primary" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.activeJobs} active`} 
                        color="warning" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.forwardJobs} forward`} 
                        color="info" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.returnJobs} return`} 
                        color="secondary" 
                        size="small" 
                      />
                      {driver.invalidAssignments > 0 && (
                        <Chip 
                          label={`${driver.invalidAssignments} issues`} 
                          color="error" 
                          size="small"
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {driver.jobs.map((job, jobIndex) => (
                      <Grid item xs={12} sm={6} md={4} key={job.job_id}>
                        <Card 
                          sx={{ 
                            height: '100%',
                            border: hasIssues(job) ? '2px solid' : '1px solid',
                            borderColor: hasIssues(job) ? 'error.main' : 'divider',
                            position: 'relative'
                          }}
                        >
                          <CardContent sx={{ pb: 1 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                {job.job_id}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Reassign to different driver">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleReassignJob(job)}
                                    disabled={reassigning}
                                  >
                                    <ReassignIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove from driver">
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleRemoveJobFromDriver(job)}
                                    disabled={reassigning}
                                    color="error"
                                  >
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Stack>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {job.VRM} • {job.source}
                            </Typography>
                            
                            <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                              <strong>Collection:</strong> {job.collection_postcode || '❌ Missing'}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                              <strong>Delivery:</strong> {job.delivery_postcode || '❌ Missing'}
                            </Typography>
                            
                            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap', gap: 1 }}>
                              <Chip 
                                label={job.job_status || 'pending'} 
                                color={getStatusColor(job.job_status)} 
                                size="small" 
                              />
                              {job.forward_return_flag && (
                                <Chip 
                                  label={job.forward_return_flag} 
                                  color={getFlagColor(job.forward_return_flag)} 
                                  size="small" 
                                />
                              )}
                              {job.driver_order_sequence && (
                                <Chip 
                                  label={`#${job.driver_order_sequence}`} 
                                  variant="outlined" 
                                  size="small" 
                                />
                              )}
                            </Stack>

                            {hasIssues(job) && (
                              <Alert severity="warning" sx={{ mt: 1, py: 0.5 }}>
                                <Typography variant="caption">
                                  ⚠️ Missing postcode - violates assignment rules
                                </Typography>
                              </Alert>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reassign Dialog */}
      <Dialog open={reassignDialog} onClose={() => setReassignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manual Job Reassignment</DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Manual override will bypass 20-mile radius and regional restrictions
                </Typography>
              </Alert>
              <Typography variant="body1" sx={{ mb: 1 }}>
                Reassigning job <strong>{selectedJob.job_id}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <strong>From:</strong> {selectedJob.selected_driver}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>Route:</strong> {selectedJob.VRM} • {selectedJob.collection_postcode || 'No postcode'} → {selectedJob.delivery_postcode || 'No postcode'}
              </Typography>
            </Box>
          )}
          <FormControl fullWidth>
            <InputLabel>Select New Driver</InputLabel>
            <Select
              value={selectedNewDriver}
              onChange={(e) => setSelectedNewDriver(e.target.value)}
              label="Select New Driver"
            >
              {availableDrivers.map(driver => (
                <MenuItem key={driver.name} value={driver.name}>
                  {driver.name} ({driver.region || 'No region'}) - {driver.max_capacity || '∞'} capacity
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReassignDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmReassign} 
            variant="contained"
            disabled={!selectedNewDriver || reassigning}
          >
            {reassigning ? 'Reassigning...' : 'Confirm Reassignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
