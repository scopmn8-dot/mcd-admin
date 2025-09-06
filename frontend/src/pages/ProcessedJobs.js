import { apiFetch } from '../api';
import React, { useEffect, useState } from 'react';
import SheetMonitorButton from '../components/SheetMonitorButton';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableHead, 
  TableRow, 
  TableCell, 
  TableBody, 
  CircularProgress, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import { Edit as EditIcon, Assignment as AssignmentIcon } from '@mui/icons-material';

export default function ProcessedJobsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [stats, setStats] = useState({ total: 0, lastProcessedAt: null });
  const [drivers, setDrivers] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchProcessed = async () => {
    setLoading(true);
    try {
      const [jobsRes, driversRes] = await Promise.all([
        apiFetch('/api/processed-jobs'),
        apiFetch('/api/drivers')
      ]);
      
      if (jobsRes.ok) {
        const j = await jobsRes.json();
        if (j.success) {
          setHeaders(j.headers || []);
          setRows(j.rows || []);
          setStats(j.stats || { total: 0, lastProcessedAt: null });
        }
      }
      
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDrivers(driversData || []);
      }
    } catch (e) {
      console.warn('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessed();
    const id = setInterval(fetchProcessed, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  const handleAssignDriver = (job) => {
    setSelectedJob(job);
    setSelectedDriver(job.selected_driver || '');
    setShowAssignDialog(true);
    setError('');
    setSuccess('');
  };

  const handleSaveAssignment = async () => {
    if (!selectedJob) return;
    
    setAssignmentLoading(true);
    setError('');
    
    try {
      // Determine source sheet based on job data
      let sourceSheet = 'motorway'; // default
      
      // Try to detect source sheet from job data
      if (selectedJob.dealer && selectedJob.dealer.includes('AT Moves')) {
        sourceSheet = 'atmoves';
      } else if (selectedJob.customer_type === 'Private' || selectedJob.job_type === 'Private') {
        sourceSheet = 'privateCustomers';
      }

      const response = await apiFetch('/api/jobs/assign-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: selectedJob.job_id,
          driverName: selectedDriver,
          sourceSheet: sourceSheet
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Assignment failed: ${response.status} - ${errorData}`);
      }

      setSuccess(`Driver ${selectedDriver ? 'assigned to' : 'unassigned from'} job ${selectedJob.job_id}`);
      setShowAssignDialog(false);
      fetchProcessed(); // Refresh data
    } catch (err) {
      setError('Failed to assign driver: ' + err.message);
    } finally {
      setAssignmentLoading(false);
    }
  };

  const getDriverJobCount = (driverName) => {
    return rows.filter(job => job.selected_driver === driverName).length;
  };

  const getStatusColor = (job) => {
    if (!job.selected_driver) return 'error';
    if (job.job_status === 'completed') return 'success';
    if (job.job_status === 'active') return 'info';
    return 'warning';
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Processed Jobs</Typography>
      <Typography variant="body1" sx={{ mb: 2, color: '#aaa' }}>
        Tools and status for the automated processed jobs consolidation.
      </Typography>

      {/* Error/Success Messages */}
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

      <Paper sx={{ p: 2, mb: 2 }}>
        <SheetMonitorButton />
        <Box sx={{ display: 'flex', gap: 2, mt: 2, alignItems: 'center' }}>
          <Typography variant="body2">Total processed rows: <strong>{stats.total}</strong></Typography>
          <Typography variant="body2">Last processed at: <strong>{stats.lastProcessedAt ? new Date(stats.lastProcessedAt).toLocaleString() : 'N/A'}</strong></Typography>
          <Button size="small" onClick={fetchProcessed}>Refresh</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                {headers.map(h => <TableCell key={h}><strong>{h}</strong></TableCell>)}
                <TableCell><strong>Driver Assignment</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  {headers.map(h => <TableCell key={h}>{r[h] || ''}</TableCell>)}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={r.selected_driver || 'Unassigned'}
                        size="small"
                        color={getStatusColor(r)}
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    {r.job_id && (
                      <Tooltip title="Assign/Change Driver">
                        <IconButton
                          size="small"
                          onClick={() => handleAssignDriver(r)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      {/* Driver Assignment Dialog */}
      <Dialog open={showAssignDialog} onClose={() => setShowAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <AssignmentIcon />
            Assign Driver to Job
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedJob && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Job ID: <strong>{selectedJob.job_id}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                VRM: <strong>{selectedJob.VRM || selectedJob.vrm || 'N/A'}</strong>
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Route: <strong>{selectedJob.collection_postcode} → {selectedJob.delivery_postcode}</strong>
              </Typography>
              
              <FormControl fullWidth>
                <InputLabel>Select Driver</InputLabel>
                <Select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  label="Select Driver"
                >
                  <MenuItem value="">
                    <em>Unassigned</em>
                  </MenuItem>
                  {drivers.map(driver => (
                    <MenuItem key={driver.Name} value={driver.Name}>
                      {driver.Name} ({getDriverJobCount(driver.Name)} jobs)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAssignDialog(false)} disabled={assignmentLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveAssignment} 
            variant="contained" 
            disabled={assignmentLoading}
            startIcon={assignmentLoading ? <CircularProgress size={16} /> : <AssignmentIcon />}
          >
            {assignmentLoading ? 'Assigning...' : 'Assign Driver'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
