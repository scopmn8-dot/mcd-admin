import { apiFetch } from '../api';
import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';

export default function DriverQueueViewer() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [queueData, setQueueData] = useState(null);
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setError('');
    setQueueData(null);
  };

  const handleClose = () => {
    setOpen(false);
    setDriverName('');
    setError('');
    setQueueData(null);
  };

  const fetchQueue = async () => {
    if (!driverName.trim()) {
      setError('Driver name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
  const response = await apiFetch(`/api/drivers/${encodeURIComponent(driverName.trim())}/queue`);
      
      if (response.ok) {
        const data = await response.json();
        setQueueData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch driver queue');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'pending': return 'default';
      default: return 'default';
    }
  };

  const getFlagColor = (flag) => {
    return flag === 'Forward' ? 'primary' : 'secondary';
  };

  return (
    <>
      <Button
        variant="outlined"
        color="info"
        onClick={handleOpen}
        sx={{ mb: 2, mr: 2 }}
      >
        View Driver Queue
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Driver Job Queue</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <TextField
              autoFocus
              margin="dense"
              label="Driver Name"
              fullWidth
              variant="outlined"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              disabled={loading}
              sx={{ mb: 2 }}
            />
            
            <Button 
              variant="contained" 
              onClick={fetchQueue} 
              disabled={loading || !driverName.trim()}
              sx={{ mr: 2 }}
            >
              {loading ? 'Loading...' : 'Fetch Queue'}
            </Button>
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {queueData && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Queue for {queueData.driver} ({queueData.totalJobs} total jobs)
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Chip label={`Completed: ${queueData.completedCount}`} color="success" sx={{ mr: 1 }} />
                <Chip label={`Pending: ${queueData.pendingCount}`} color="default" sx={{ mr: 1 }} />
                {queueData.activeJob && (
                  <Chip label={`Active: ${queueData.activeJob.job_id}`} color="warning" />
                )}
              </Box>

              {queueData.activeJob && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="subtitle1">
                    <strong>Current Active Job:</strong> {queueData.activeJob.job_id} (Sequence #{queueData.activeJob.driver_order_sequence})
                  </Typography>
                  <Typography variant="body2">
                    {queueData.activeJob.collection_full_address} → {queueData.activeJob.delivery_full_address}
                  </Typography>
                </Alert>
              )}

              {queueData.totalJobs === 0 ? (
                <Alert severity="info">No jobs found for this driver.</Alert>
              ) : (
                <Box>
                  {/* Pending Jobs */}
                  {queueData.pendingJobs.length > 0 && (
                    <Accordion defaultExpanded>
                      <AccordionSummary expandIcon={<span>▼</span>}>
                        <Typography variant="subtitle1">
                          Pending Jobs ({queueData.pendingJobs.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {queueData.pendingJobs.map((job) => (
                          <Card key={job.job_id} sx={{ mb: 2, border: job.job_active ? '2px solid orange' : '1px solid #e0e0e0' }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Typography variant="h6">
                                  #{job.driver_order_sequence} - {job.job_id}
                                </Typography>
                                <Box>
                                  <Chip 
                                    label={job.job_active ? 'ACTIVE' : job.job_status} 
                                    color={job.job_active ? 'warning' : getStatusColor(job.job_status)} 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                  />
                                  {job.forward_return_flag && (
                                    <Chip 
                                      label={job.forward_return_flag} 
                                      color={getFlagColor(job.forward_return_flag)} 
                                      size="small" 
                                    />
                                  )}
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Collection:</strong> {job.collection_full_address}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Delivery:</strong> {job.delivery_full_address}
                              </Typography>
                              
                              <Box display="flex" gap={2} sx={{ mt: 1 }}>
                                {job.collection_date && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Collection:</strong> {job.collection_date}
                                  </Typography>
                                )}
                                {job.delivery_date && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Delivery:</strong> {job.delivery_date}
                                  </Typography>
                                )}
                              </Box>
                            </CardContent>
                          </Card>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {/* Completed Jobs */}
                  {queueData.completedJobs.length > 0 && (
                    <Accordion>
                      <AccordionSummary expandIcon={<span>▼</span>}>
                        <Typography variant="subtitle1">
                          Completed Jobs ({queueData.completedJobs.length})
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {queueData.completedJobs.map((job) => (
                          <Card key={job.job_id} sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                            <CardContent>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                                <Typography variant="h6">
                                  #{job.driver_order_sequence} - {job.job_id}
                                </Typography>
                                <Box>
                                  <Chip 
                                    label="completed" 
                                    color="success" 
                                    size="small" 
                                    sx={{ mr: 1 }}
                                  />
                                  {job.forward_return_flag && (
                                    <Chip 
                                      label={job.forward_return_flag} 
                                      color={getFlagColor(job.forward_return_flag)} 
                                      size="small" 
                                    />
                                  )}
                                </Box>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                <strong>Collection:</strong> {job.collection_full_address}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Delivery:</strong> {job.delivery_full_address}
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
