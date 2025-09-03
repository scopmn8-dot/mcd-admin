import React from 'react';
import { Box, CircularProgress, Typography, Stack } from '@mui/material';

const ModernLoader = ({ message = "Loading...", size = 60 }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: 200,
        p: 4,
      }}
    >
      <Stack alignItems="center" spacing={3}>
        <Box sx={{ position: 'relative' }}>
          <CircularProgress
            size={size}
            thickness={4}
            sx={{
              color: 'primary.main',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              width: size * 0.7,
              height: size * 0.7,
              margin: 'auto',
              opacity: 0.1,
              animation: 'pulse 2s infinite',
            }}
          />
        </Box>
        
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{
            fontWeight: 600,
            textAlign: 'center',
            opacity: 0.8,
          }}
        >
          {message}
        </Typography>
      </Stack>
    </Box>
  );
};

export default ModernLoader;
