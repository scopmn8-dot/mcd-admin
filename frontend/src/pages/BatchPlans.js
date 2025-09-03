import { apiFetch } from '../api';
import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Grid,
  Table, TableHead, TableBody, TableRow, TableCell, Checkbox,
  IconButton, Collapse, Tooltip
} from '@mui/material';
import { ExpandMore, ExpandLess, FileDownload } from '@mui/icons-material';

export default function BatchPlans() {
  const [batches, setBatches] = useState([]);
  const [limit, setLimit] = useState(50);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [batchName, setBatchName] = useState('');
  const [clusterIds, setClusterIds] = useState('');
  const [jobIds, setJobIds] = useState('');
  const [suggestedClusters, setSuggestedClusters] = useState([]);
  const [selectedClusterIds, setSelectedClusterIds] = useState(new Set());
  const [expanded, setExpanded] = useState(new Set());
  const [filterText, setFilterText] = useState('');

  async function loadBatches() {
  const res = await apiFetch(`/api/batch-plans?limit=${limit}`);
    const json = await res.json();
    if (json && json.batches) setBatches(json.batches);
  }

  async function loadBatch(batchId) {
  const res = await apiFetch(`/api/batch-plans/${batchId}`);
    const json = await res.json();
    if (json && json.jobs) {
      setSelectedBatch(batchId);
      setJobs(json.jobs);
    }
  }

  async function loadSuggestedClusters() {
    try {
  const res = await apiFetch('/api/clusters/suggest');
      const json = await res.json();
      if (Array.isArray(json)) {
        setSuggestedClusters(json.map((c, idx) => ({ clusterId: c.clusterId || `SUG-${idx+1}`, jobs: c.jobs || [], score: c.score || 0 })));
      }
    } catch (e) { console.error('Failed to load suggested clusters', e); }
  }

  async function createBatch() {
    const payload = { batchName };
    const clusterArray = Array.from(selectedClusterIds);
    if (clusterArray.length > 0) payload.clusterIds = clusterArray;
    else if (clusterIds.trim()) payload.clusterIds = clusterIds.split(',').map(s => s.trim()).filter(Boolean);
    if (jobIds.trim()) payload.jobIds = jobIds.split(',').map(s => s.trim()).filter(Boolean);
  const res = await apiFetch('/api/batch-plans/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const json = await res.json();
    if (json && json.success) {
      await loadBatches();
      if (json.batchId) loadBatch(json.batchId);
    } else {
      alert('Failed to create batch: ' + (json && json.error ? json.error : 'unknown'));
    }
  }

  useEffect(() => { loadBatches(); loadSuggestedClusters(); }, [limit]);

  const filteredClusters = useMemo(() => {
    if (!filterText) return suggestedClusters;
    const q = filterText.toLowerCase();
    return suggestedClusters.filter(c => c.clusterId.toLowerCase().includes(q) || c.jobs.some(j => (j.job_id || '').toLowerCase().includes(q)));
  }, [filterText, suggestedClusters]);

  const selectedJobs = useMemo(() => {
    const sel = [];
    for (const c of suggestedClusters) {
      if (selectedClusterIds.has(c.clusterId)) {
        for (const j of c.jobs) sel.push({ ...j, cluster_id: c.clusterId });
      }
    }
    return sel;
  }, [selectedClusterIds, suggestedClusters]);

  function toggleClusterSelection(clusterId) {
    const next = new Set(selectedClusterIds);
    if (next.has(clusterId)) next.delete(clusterId); else next.add(clusterId);
    setSelectedClusterIds(next);
  }

  function toggleExpand(clusterId) {
    const next = new Set(expanded);
    if (next.has(clusterId)) next.delete(clusterId); else next.add(clusterId);
    setExpanded(next);
  }

  function selectAllVisible(checked) {
    const next = new Set(selectedClusterIds);
    for (const c of filteredClusters) {
      if (checked) next.add(c.clusterId); else next.delete(c.clusterId);
    }
    setSelectedClusterIds(next);
  }

  function exportSelectedCSV() {
    const rows = selectedJobs;
    if (rows.length === 0) return alert('No jobs selected');
    const header = ['job_id','cluster_id','source_sheet','selected_driver','collection_postcode','delivery_postcode'];
    const csv = [header.join(',')].concat(rows.map(r => header.map(h => `"${(r[h]||'').toString().replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `batch_jobs_${Date.now()}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Typography variant="h5">Batch Plans</Typography>
            <Typography variant="body2">Create and view batch plans generated from clusters or individual jobs.</Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Batch name" value={batchName} onChange={e => setBatchName(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', gap: 1 }}>
            <Button variant="contained" onClick={createBatch} disabled={selectedClusterIds.size === 0 && !clusterIds.trim() && !jobIds.trim()}>Create Batch</Button>
            <Tooltip title="Export selected jobs to CSV"><span>
              <Button variant="outlined" startIcon={<FileDownload />} onClick={exportSelectedCSV} disabled={selectedJobs.length === 0}>Export CSV</Button>
            </span></Tooltip>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Grid container alignItems="center" spacing={1} sx={{ mb: 1 }}>
              <Grid item xs={8}><TextField fullWidth placeholder="Filter clusters or job id" value={filterText} onChange={e => setFilterText(e.target.value)} /></Grid>
              <Grid item xs={4} sx={{ textAlign: 'right' }}>
                <Button size="small" onClick={() => selectAllVisible(true)}>Select all</Button>
                <Button size="small" onClick={() => selectAllVisible(false)}>Clear</Button>
              </Grid>
            </Grid>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox"><Checkbox checked={filteredClusters.length > 0 && filteredClusters.every(c=>selectedClusterIds.has(c.clusterId))} onChange={e => selectAllVisible(e.target.checked)} /></TableCell>
                  <TableCell>Cluster</TableCell>
                  <TableCell>Jobs</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredClusters.map(c => (
                  <React.Fragment key={c.clusterId}>
                    <TableRow>
                      <TableCell padding="checkbox"><Checkbox checked={selectedClusterIds.has(c.clusterId)} onChange={() => toggleClusterSelection(c.clusterId)} /></TableCell>
                      <TableCell>{c.clusterId}</TableCell>
                      <TableCell>{c.jobs.map(j=>j.job_id).join(', ')}</TableCell>
                      <TableCell>{c.score}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggleExpand(c.clusterId)}>{expanded.has(c.clusterId)?<ExpandLess/>:<ExpandMore/>}</IconButton>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={5} sx={{ p: 0, border: 0 }}>
                        <Collapse in={expanded.has(c.clusterId)} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2">Jobs</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Job ID</TableCell>
                                  <TableCell>Source</TableCell>
                                  <TableCell>Driver</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {c.jobs.map(j => (
                                  <TableRow key={j.job_id}>
                                    <TableCell>{j.job_id}</TableCell>
                                    <TableCell>{j.source_sheet || j.sheet || ''}</TableCell>
                                    <TableCell>{j.selected_driver || j.driver || ''}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6">Preview: Selected Jobs ({selectedJobs.length})</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Job ID</TableCell>
                  <TableCell>Cluster</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Driver</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selectedJobs.map((j,i) => (
                  <TableRow key={i}>
                    <TableCell>{j.job_id}</TableCell>
                    <TableCell>{j.cluster_id}</TableCell>
                    <TableCell>{j.source_sheet || j.sheet || ''}</TableCell>
                    <TableCell>{j.selected_driver || j.driver || ''}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
