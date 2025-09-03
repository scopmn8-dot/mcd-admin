import React, { useState } from 'react';
import { apiFetch } from '../api';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';

export default function JobCompletionButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleOpen = () => {
    setOpen(true);
    setMessage('');
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setJobId('');
    setDriverName('');
    setMessage('');
    setError('');
  };

  const handleComplete = async () => {
    if (!jobId.trim() || !driverName.trim()) {
      setError('Both Job ID and Driver Name are required');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
  const response = await apiFetch('/api/jobs/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_id: jobId.trim(),
          driver_name: driverName.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        setJobId('');
        setDriverName('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to complete job');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="success"
        onClick={handleOpen}
        sx={{ mb: 2, mr: 2 }}
      >
        Complete Job
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Job</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Mark a job as completed and automatically reassign order IDs for the driver's remaining jobs.
          </DialogContentText>
          
          <TextField
            autoFocus
            margin="dense"
            label="Job ID"
            fullWidth
            variant="outlined"
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Driver Name"
            fullWidth
            variant="outlined"
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />

          {loading && (
            <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
              <CircularProgress />
            </Box>
          )}

          {message && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {message}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleComplete} 
            variant="contained" 
            disabled={loading || !jobId.trim() || !driverName.trim()}
          >
            {loading ? 'Completing...' : 'Complete Job'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
