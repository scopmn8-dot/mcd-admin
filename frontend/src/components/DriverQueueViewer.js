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
  Stack,
  Divider,
  Grid
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  DirectionsCar as CarIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';

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
        startIcon={<VisibilityIcon />}
        onClick={handleOpen}
        sx={{ 
          borderRadius: 3,
          px: 3,
          py: 1.5,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: 'info.main',
            color: 'white',
            borderColor: 'info.main',
          }
        }}
      >
        View Driver Queue
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            <CarIcon color="primary" />
            <Typography variant="h6">Driver Job Queue</Typography>
          </Stack>
        </DialogTitle>
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
              placeholder="Enter exact driver name..."
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              onClick={fetchQueue}
              disabled={loading || !driverName.trim()}
              startIcon={loading ? <CircularProgress size={20} /> : <AssignmentIcon />}
              sx={{ borderRadius: 2 }}
            >
              {loading ? 'Loading...' : 'View Queue'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {queueData && (
            <Box>
              <Card sx={{ mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {queueData.driver}
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Typography variant="body2">
                      Total Jobs: {queueData.jobs.length}
                    </Typography>
                    <Typography variant="body2">
                      Active: {queueData.jobs.filter(j => j.job_active === 'true').length}
                    </Typography>
                    <Typography variant="body2">
                      Completed: {queueData.jobs.filter(j => j.job_status === 'completed').length}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>

              {queueData.jobs.length === 0 ? (
                <Alert severity="info">
                  No jobs assigned to this driver.
                </Alert>
              ) : (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                    Job Queue (Ordered by Sequence)
                  </Typography>
                  {queueData.jobs.map((job, index) => (
                    <Accordion key={job.job_id || index}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            #{job.driver_order_sequence || index + 1}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body1">
                              Job {job.job_id} - {job.VRM}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {job.collection_town_city} → {job.delivery_town_city}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={1}>
                            <Chip 
                              label={job.job_status || 'pending'} 
                              size="small" 
                              color={getStatusColor(job.job_status)}
                            />
                            {job.job_active === 'true' && (
                              <Chip label="Active" size="small" color="warning" />
                            )}
                            <Chip 
                              label={job.forward_return_flag || 'Unknown'} 
                              size="small" 
                              color={getFlagColor(job.forward_return_flag)}
                            />
                          </Stack>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Collection Details
                            </Typography>
                            <Typography variant="body2">
                              <strong>Address:</strong> {job.collection_full_address || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Contact:</strong> {job.collection_contact_first_name} {job.collection_contact_surname}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Phone:</strong> {job.collection_phone_number || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Date:</strong> {job.collection_date || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Delivery Details
                            </Typography>
                            <Typography variant="body2">
                              <strong>Address:</strong> {job.delivery_full_address || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Contact:</strong> {job.delivery_contact_first_name} {job.delivery_contact_surname}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Phone:</strong> {job.delivery_phone_number || 'N/A'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Date:</strong> {job.delivery_date || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={12}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2">
                              <strong>Vehicle:</strong> {job.vehicle_year} {job.vehicle_colour} {job.vehicle_fuel} ({job.vehicle_gearbox})
                            </Typography>
                            <Typography variant="body2">
                              <strong>Distance:</strong> {job.distance} | <strong>Cluster:</strong> {job.cluster_id || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
