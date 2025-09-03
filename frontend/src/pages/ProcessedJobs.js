import React, { useEffect, useState } from 'react';
import SheetMonitorButton from '../components/SheetMonitorButton';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Button } from '@mui/material';

export default function ProcessedJobsPage() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [stats, setStats] = useState({ total: 0, lastProcessedAt: null });

  const fetchProcessed = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/processed-jobs');
      if (res.ok) {
        const j = await res.json();
        if (j.success) {
          setHeaders(j.headers || []);
          setRows(j.rows || []);
          setStats(j.stats || { total: 0, lastProcessedAt: null });
        }
      }
    } catch (e) {
      console.warn('Failed to fetch processed jobs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcessed();
    const id = setInterval(fetchProcessed, 15000); // refresh every 15s
    return () => clearInterval(id);
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 2 }}>Processed Jobs</Typography>
      <Typography variant="body1" sx={{ mb: 2, color: '#aaa' }}>
        Tools and status for the automated processed jobs consolidation.
      </Typography>

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
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  {headers.map(h => <TableCell key={h}>{r[h] || ''}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
}
