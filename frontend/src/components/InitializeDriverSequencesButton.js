import { apiFetch } from '../api';
import React, { useState } from 'react';
import { Button, Alert, CircularProgress } from '@mui/material';

export default function InitializeDriverSequencesButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setMessage('');
    setError('');

    try {
  const response = await apiFetch('/api/jobs/initialize-driver-sequences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to initialize driver sequences');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <Button 
        variant="outlined" 
        color="secondary" 
        onClick={handleClick} 
        disabled={loading}
        sx={{ mr: 2 }}
      >
        {loading ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            Initializing...
          </>
        ) : (
          'Initialize Driver Sequences'
        )}
      </Button>
      
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
    </div>
  );
}
