import { apiFetch } from '../api';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  LinearProgress,
  Grid,
  Divider
} from '@mui/material';
/* kept Grid from @mui/material above */

export default function DriverJobAssignments() {
  const [loading, setLoading] = useState(true);
  const [driverData, setDriverData] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDriverAssignments();
  }, []);

  const fetchDriverAssignments = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs data
      const [motorwayRes, atmovesRes, privateRes] = await Promise.all([
  apiFetch('/api/motorway'),
  apiFetch('/api/atmoves'),
  apiFetch('/api/private-customers')
      ]);

      if (!motorwayRes.ok || !atmovesRes.ok || !privateRes.ok) {
        throw new Error('Failed to fetch job data');
      }

      const [motorway, atmoves, privateCustomers] = await Promise.all([
        motorwayRes.json(),
        atmovesRes.json(),
        privateRes.json()
      ]);

      // Combine all jobs
      const allJobs = [
        ...motorway.map(job => ({ ...job, source: 'Motorway' })),
        ...atmoves.map(job => ({ ...job, source: 'AT Moves' })),
        ...privateCustomers.map(job => ({ ...job, source: 'Private Customers' }))
      ];

      // Group jobs by driver
      const driverJobsMap = {};
      
      allJobs.forEach(job => {
        if (job.selected_driver) {
          if (!driverJobsMap[job.selected_driver]) {
            driverJobsMap[job.selected_driver] = {
              driverName: job.selected_driver,
              totalJobs: 0,
              activeJobs: 0,
              completedJobs: 0,
              pendingJobs: 0,
              jobs: []
            };
          }
          
          driverJobsMap[job.selected_driver].jobs.push(job);
          driverJobsMap[job.selected_driver].totalJobs++;
          
          if (job.job_status === 'completed') {
            driverJobsMap[job.selected_driver].completedJobs++;
          } else if (job.job_active === 'true' || job.job_status === 'active') {
            driverJobsMap[job.selected_driver].activeJobs++;
          } else {
            driverJobsMap[job.selected_driver].pendingJobs++;
          }
        }
      });

      // Convert to array and sort jobs within each driver
      const driverList = Object.values(driverJobsMap).map(driver => ({
        ...driver,
        jobs: driver.jobs.sort((a, b) => {
          const aSeq = parseInt(a.driver_order_sequence || '999');
          const bSeq = parseInt(b.driver_order_sequence || '999');
          return aSeq - bSeq;
        })
      }));

      // Sort drivers by total jobs (descending)
      driverList.sort((a, b) => b.totalJobs - a.totalJobs);

      setDriverData(driverList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getJobStatusColor = (job) => {
    if (job.job_status === 'completed') return 'success';
    if (job.job_active === 'true' || job.job_status === 'active') return 'warning';
    return 'default';
  };

  const getJobStatusLabel = (job) => {
    if (job.job_status === 'completed') return 'COMPLETED';
    if (job.job_active === 'true' || job.job_status === 'active') return 'ACTIVE';
    return 'PENDING';
  };

  if (loading) {
    return (
      <Box>
        <LinearProgress sx={{ mb: 2 }} />
        <Typography>Loading driver assignments...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading driver assignments: {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>
        Driver Job Assignments
      </Typography>

      {driverData.length === 0 ? (
        <Alert severity="info">
          No drivers with assigned jobs found.
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {driverData.map((driver, index) => (
            <Grid xs={12} key={driver.driverName}>
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="h6">
                      👤 {driver.driverName}
                    </Typography>
                    <Box display="flex" gap={1}>
                      <Chip 
                        label={`${driver.totalJobs} Total`} 
                        color="primary" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.activeJobs} Active`} 
                        color="warning" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.completedJobs} Done`} 
                        color="success" 
                        size="small" 
                      />
                      <Chip 
                        label={`${driver.pendingJobs} Pending`} 
                        color="default" 
                        size="small" 
                      />
                    </Box>
                  </Box>

                  <Accordion>
                    <AccordionSummary expandIcon={<span>▼</span>}>
                      <Typography variant="body1">
                        View Jobs ({driver.jobs.length})
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {driver.jobs.map((job, jobIndex) => (
                        <Card 
                          key={job.job_id} 
                          sx={{ 
                            mb: 1, 
                            border: job.job_active === 'true' ? '2px solid orange' : '1px solid #e0e0e0',
                            bgcolor: job.job_status === 'completed' ? '#f5f5f5' : 'white'
                          }}
                        >
                          <CardContent sx={{ py: 1 }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle2">
                                #{job.driver_order_sequence || '?'} - {job.job_id}
                              </Typography>
                              <Box display="flex" gap={1}>
                                <Chip 
                                  label={getJobStatusLabel(job)} 
                                  color={getJobStatusColor(job)} 
                                  size="small" 
                                />
                                <Chip 
                                  label={job.source} 
                                  variant="outlined" 
                                  size="small" 
                                />
                              </Box>
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              📍 Collection: {job.collection_full_address || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              🎯 Delivery: {job.delivery_full_address || 'N/A'}
                            </Typography>
                            
                            <Box display="flex" gap={2} sx={{ mt: 1 }}>
                              {job.collection_date && (
                                <Typography variant="body2" color="text.secondary">
                                  📅 Collection: {job.collection_date}
                                </Typography>
                              )}
                              {job.delivery_date && (
                                <Typography variant="body2" color="text.secondary">
                                  📅 Delivery: {job.delivery_date}
                                </Typography>
                              )}
                              {job.cluster_id && (
                                <Typography variant="body2" color="text.secondary">
                                  🔗 Cluster: {job.cluster_id}
                                </Typography>
                              )}
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </AccordionDetails>
                  </Accordion>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
