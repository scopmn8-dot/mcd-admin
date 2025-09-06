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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  SwapHoriz as ReassignIcon,
  Remove as RemoveIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  Refresh as RefreshIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon
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
  const [expandedDriver, setExpandedDriver] = useState(null);

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

  const handleToggleExpand = (driverName) => {
    setExpandedDriver(expandedDriver === driverName ? null : driverName);
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
        <TableContainer 
          component={Paper} 
          sx={{ 
            mt: 2, 
            maxWidth: '100%',
            overflow: 'auto',
            maxHeight: 'calc(100vh - 300px)'
          }}
        >
          <Table sx={{ minWidth: 650, tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 600, width: '200px' }}>Driver</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '120px' }}>Region</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '100px' }}>Total Jobs</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '80px' }}>Active</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '100px' }}>Completed</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '80px' }}>Forward</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '80px' }}>Return</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '80px' }}>Issues</TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, width: '120px' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {driverData.map((driver) => (
                <React.Fragment key={driver.driverName}>
                  <TableRow 
                    sx={{ 
                      '&:hover': { bgcolor: 'grey.50' },
                      cursor: 'pointer',
                      bgcolor: expandedDriver === driver.driverName ? 'primary.50' : 'inherit'
                    }}
                    onClick={() => handleToggleExpand(driver.driverName)}
                  >
                    <TableCell sx={{ width: '200px' }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <IconButton size="small">
                          {expandedDriver === driver.driverName ? <ArrowUpIcon /> : <ArrowDownIcon />}
                        </IconButton>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {driver.driverName}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ width: '120px' }}>
                      <Chip 
                        label={getDriverRegion(driver.driverName)} 
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '100px' }}>
                      <Chip 
                        label={driver.totalJobs} 
                        color="primary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '80px' }}>
                      <Chip 
                        label={driver.activeJobs} 
                        color="warning"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '100px' }}>
                      <Chip 
                        label={driver.completedJobs} 
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '80px' }}>
                      <Chip 
                        label={driver.forwardJobs} 
                        color="info"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '80px' }}>
                      <Chip 
                        label={driver.returnJobs} 
                        color="secondary"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ width: '80px' }}>
                      {driver.invalidAssignments > 0 ? (
                        <Chip 
                          label={driver.invalidAssignments} 
                          color="error"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      ) : (
                        <Chip 
                          label="0" 
                          color="success"
                          size="small"
                          icon={<CheckIcon />}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '120px' }}>
                      <Button
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          fetchDriverAssignments();
                        }}
                      >
                        Refresh
                      </Button>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
                      <Collapse in={expandedDriver === driver.driverName} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 2 }}>
                          <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 600 }}>
                            Job Details for {driver.driverName}
                          </Typography>
                          
                          <TableContainer sx={{ maxHeight: '400px', overflow: 'auto' }}>
                            <Table size="small" sx={{ tableLayout: 'fixed' }}>
                              <TableHead>
                                <TableRow sx={{ bgcolor: 'grey.100' }}>
                                  <TableCell sx={{ fontWeight: 600, width: '120px' }}>Job ID</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '100px' }}>VRM</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '120px' }}>Source</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '120px' }}>Collection</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '120px' }}>Delivery</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '100px' }}>Status</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '100px' }}>Type</TableCell>
                                  <TableCell sx={{ fontWeight: 600, width: '80px' }}>Sequence</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 600, width: '120px' }}>Actions</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {driver.jobs.map((job) => (
                                  <TableRow 
                                    key={job.job_id}
                                    sx={{ 
                                      bgcolor: hasIssues(job) ? 'error.50' : 'inherit',
                                      '&:hover': { bgcolor: hasIssues(job) ? 'error.100' : 'grey.50' }
                                    }}
                                  >
                                    <TableCell sx={{ width: '120px' }}>
                                      <Typography 
                                        variant="body2" 
                                        sx={{ 
                                          fontWeight: 600,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {job.job_id}
                                      </Typography>
                                      {hasIssues(job) && (
                                        <Typography variant="caption" color="error" display="block">
                                          ⚠️ Missing postcode
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ width: '100px' }}>
                                      <Typography 
                                        variant="body2"
                                        sx={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {job.VRM || 'N/A'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: '120px' }}>
                                      <Chip 
                                        label={job.source} 
                                        size="small" 
                                        variant="outlined"
                                      />
                                    </TableCell>
                                    <TableCell sx={{ width: '120px' }}>
                                      <Typography 
                                        variant="body2" 
                                        color={job.collection_postcode ? 'text.primary' : 'error'}
                                        sx={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {job.collection_postcode || '❌ Missing'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: '120px' }}>
                                      <Typography 
                                        variant="body2" 
                                        color={job.delivery_postcode ? 'text.primary' : 'error'}
                                        sx={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        {job.delivery_postcode || '❌ Missing'}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ width: '100px' }}>
                                      <Chip 
                                        label={job.job_status || 'pending'} 
                                        color={getStatusColor(job.job_status)} 
                                        size="small"
                                      />
                                    </TableCell>
                                    <TableCell sx={{ width: '100px' }}>
                                      {job.forward_return_flag ? (
                                        <Chip 
                                          label={job.forward_return_flag} 
                                          color={getFlagColor(job.forward_return_flag)} 
                                          size="small"
                                        />
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          N/A
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell sx={{ width: '80px' }}>
                                      {job.driver_order_sequence ? (
                                        <Chip 
                                          label={`#${job.driver_order_sequence}`} 
                                          variant="outlined" 
                                          size="small"
                                        />
                                      ) : (
                                        <Typography variant="body2" color="text.secondary">
                                          Not set
                                        </Typography>
                                      )}
                                    </TableCell>
                                    <TableCell align="center" sx={{ width: '120px' }}>
                                      <Stack direction="row" spacing={0.5}>
                                        <Tooltip title="Reassign to different driver">
                                          <IconButton 
                                            size="small" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleReassignJob(job);
                                            }}
                                            disabled={reassigning}
                                          >
                                            <ReassignIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Remove from driver">
                                          <IconButton 
                                            size="small" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveJobFromDriver(job);
                                            }}
                                            disabled={reassigning}
                                            color="error"
                                          >
                                            <RemoveIcon fontSize="small" />
                                          </IconButton>
                                        </Tooltip>
                                      </Stack>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
