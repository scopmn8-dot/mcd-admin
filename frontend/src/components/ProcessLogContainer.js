import React from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

export default function ProcessLogContainer({ logs, timeSpent, eta }) {
  return (
    <Paper sx={{ p: 2, mt: 3, background: '#181c24', color: '#fff', minHeight: 120 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>Process Log</Typography>
      <Box sx={{ fontSize: 14, mb: 1 }}>
        <b>Time Spent:</b> {timeSpent ? `${timeSpent}s` : 'N/A'}<br />
        <b>ETA:</b> {eta ? `${eta}s` : 'N/A'}
      </Box>
      <Box sx={{ maxHeight: 200, overflowY: 'auto', fontFamily: 'monospace', fontSize: 13, background: '#111', p: 1, borderRadius: 1 }}>
        {logs && logs.length > 0 ? logs.map((log, i) => (
          <div key={i}>{log}</div>
        )) : <span>No logs yet.</span>}
      </Box>
    </Paper>
  );
}
