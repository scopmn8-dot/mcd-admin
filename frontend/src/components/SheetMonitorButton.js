import { apiFetch } from '../api';
import React, { useState, useEffect } from 'react';
import { Button, Alert, CircularProgress, Typography, Box, LinearProgress, Chip } from '@mui/material';

export default function AutomaticMonitoringDashboard() {
  const [manualChecking, setManualChecking] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [countdown, setCountdown] = useState(30);
  const [sheetUrl, setSheetUrl] = useState('');

  // Fetch monitoring status from server
  const fetchMonitoringStatus = async () => {
    try {
  const response = await apiFetch('/api/jobs/monitoring-status');
      if (response.ok) {
        const data = await response.json();
        setMonitoringStatus(data);
        setCountdown(Math.max(0, data.nextRunIn || 0));
      }
    } catch (err) {
      // Silently handle errors to avoid cluttering the UI
      console.error('Failed to fetch monitoring status:', err);
    }
  };

  const fetchSheetUrl = async () => {
    try {
  const res = await apiFetch('/api/spreadsheet-url');
      if (res.ok) {
        const j = await res.json();
        setSheetUrl(j.url || '');
      }
    } catch (e) { console.warn('Could not fetch sheet URL', e); }
  };

  // Update status every second - this is the automatic part
  useEffect(() => {
  fetchMonitoringStatus(); // Initial fetch
  fetchSheetUrl();
    
    const interval = setInterval(() => {
      fetchMonitoringStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Manual check function (optional override)
  const triggerManualCheck = async () => {
    setManualChecking(true);
    setMessage('');
    setError('');

    try {
  const response = await apiFetch('/api/jobs/monitor-sheet-changes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
        fetchMonitoringStatus(); // Refresh status after manual check
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to trigger monitoring');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setManualChecking(false);
    }
  };

  // Manual export removed; processed jobs are written automatically server-side.

  const formatTime = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleTimeString();
  };

  const getProgressValue = () => {
    if (!monitoringStatus) return 0;
    const elapsed = 30 - countdown;
    return (elapsed / 30) * 100;
  };

  const getStatusColor = () => {
    if (!monitoringStatus) return 'default';
    if (!monitoringStatus.isRunning) return 'error';
    if (countdown <= 5) return 'warning'; // Show warning when check is imminent
    return 'success';
  };

  const getStatusText = () => {
    if (!monitoringStatus) return 'UNKNOWN';
    if (!monitoringStatus.isRunning) return 'INACTIVE';
    if (countdown <= 5) return 'CHECKING SOON';
    return 'ACTIVE';
  };

  return (
    <Box sx={{ mb: 2, p: 2, border: '1px solid #333', borderRadius: 1, bgcolor: 'black', color: 'white' }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ color: 'white' }}>
          🔄 Automatic Sheet Monitoring
        </Typography>
        <Chip 
          label={getStatusText()} 
          color={getStatusColor()} 
          size="small" 
        />
      </Box>
      
      <Typography variant="body2" sx={{ mb: 2, color: '#ccc' }}>
        System automatically monitors Google Sheets every 30 seconds for job completions and updates driver sequences in real-time.
      </Typography>

      {monitoringStatus && (
        <Box sx={{ mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'white' }}>
              {countdown > 0 ? (
                <>Next automatic check in: <strong style={{ color: '#00ff00' }}>{countdown}s</strong></>
              ) : (
                <><strong style={{ color: '#ffff00' }}>Checking now...</strong></>
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Last checked: {formatTime(monitoringStatus.lastRun)}
            </Typography>
          </Box>
          
          <LinearProgress 
            variant="determinate" 
            value={getProgressValue()} 
            sx={{ 
              height: 8, 
              borderRadius: 4, 
              mb: 2,
              bgcolor: '#333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: countdown <= 5 ? '#ff9800' : '#00ff00'
              }
            }}
          />

          <Box display="flex" gap={3} sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Total monitoring cycles: <strong style={{ color: 'white' }}>{monitoringStatus.stats.totalRuns}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Jobs auto-processed: <strong style={{ color: 'white' }}>{monitoringStatus.stats.jobsProcessed}</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: '#ccc' }}>
              Last cycle found: <strong style={{ color: 'white' }}>{monitoringStatus.stats.lastProcessedJobs} completions</strong>
            </Typography>
          </Box>

          {monitoringStatus.stats.lastProcessedJobs > 0 && (
            <Alert severity="success" sx={{ mb: 2 }}>
              ✅ Last automatic check processed {monitoringStatus.stats.lastProcessedJobs} job completion(s)
            </Alert>
          )}
        </Box>
      )}
      
      <Box display="flex" alignItems="center" gap={2} sx={{ pt: 1, borderTop: '1px solid #555' }}>
        <Typography variant="body2" sx={{ flexGrow: 1, color: '#ccc' }}>
          💡 System works automatically - no manual intervention needed
        </Typography>
        
        <Button 
          variant="outlined" 
          color="info" 
          onClick={triggerManualCheck} 
          disabled={manualChecking}
          size="small"
          sx={{ 
            borderColor: '#555',
            color: 'white',
            '&:hover': {
              borderColor: '#777',
              bgcolor: '#333'
            }
          }}
        >
          {manualChecking ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1, color: 'white' }} />
              Checking...
            </>
          ) : (
            'Force Check Now'
          )}
        </Button>

        <Button
          variant="outlined"
          color="primary"
          onClick={() => { if (sheetUrl) window.open(sheetUrl, '_blank', 'noopener,noreferrer'); }}
          size="small"
          disabled={!sheetUrl}
          sx={{
            borderColor: '#555',
            color: 'white',
            ml: 1,
            '&:hover': { borderColor: '#777', bgcolor: '#333' }
          }}
        >
          {sheetUrl ? 'Open Spreadsheet' : 'Loading...'}
        </Button>
      </Box>
      
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
    </Box>
  );
}
