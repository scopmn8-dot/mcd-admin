import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../api';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  Grid,
  IconButton,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  DirectionsCar as CarIcon,
  LocationOn as LocationIcon,
  Navigation as NavigationIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  TrackChanges as TrackingIcon,
  Map as MapIcon,
  Dashboard as DashboardIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CompletedIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon
} from '@mui/icons-material';

const DriverTracker = () => {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [map, setMap] = useState(null);
  const [driverMarkers, setDriverMarkers] = useState({});
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5);
  const [viewMode, setViewMode] = useState('map'); // 'map' or 'list'
  const [loading, setLoading] = useState(false);
  const [trackingStats, setTrackingStats] = useState({
    totalDrivers: 0,
    activeDrivers: 0,
    onRoute: 0,
    completedToday: 0
  });

  const mapRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current) {
      initializeMap();
    }
  }, []);

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchDriversData();
      }, refreshInterval * 1000);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval]);

  // Initial data load
  useEffect(() => {
    fetchDriversData();
  }, []);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 10,
      center: { lat: 51.5074, lng: -0.1278 }, // Default to London
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'simplified' }]
        }
      ]
    });

    setMap(mapInstance);
  };

  const fetchDriversData = async () => {
    setLoading(true);
    
    try {
      const response = await apiFetch('/api/admin/drivers-tracking');
      
      if (response.ok) {
        const data = await response.json();
        setDrivers(data.drivers);
        setTrackingStats(data.stats);
        updateDriverMarkers(data.drivers);
      }
    } catch (error) {
      console.error('Error fetching drivers data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDriverMarkers = (driversData) => {
    if (!map) return;

    // Clear existing markers
    Object.values(driverMarkers).forEach(marker => marker.setMap(null));
    const newMarkers = {};

    driversData.forEach(driver => {
      if (driver.currentLocation) {
        const position = {
          lat: driver.currentLocation.lat,
          lng: driver.currentLocation.lng
        };

        const statusColor = getDriverStatusColor(driver.status);
        
        const marker = new window.google.maps.Marker({
          position: position,
          map: map,
          title: `${driver.name} - ${driver.status}`,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(createDriverMarkerSVG(statusColor, driver.name.charAt(0)))}`,
            scaledSize: new window.google.maps.Size(40, 40),
            anchor: new window.google.maps.Point(20, 20)
          }
        });

        // Add click listener to show driver info
        marker.addListener('click', () => {
          setSelectedDriver(driver);
          showDriverInfoWindow(marker, driver);
        });

        newMarkers[driver.id] = marker;
      }
    });

    setDriverMarkers(newMarkers);
    
    // Fit map to show all drivers
    if (driversData.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      driversData.forEach(driver => {
        if (driver.currentLocation) {
          bounds.extend(new window.google.maps.LatLng(
            driver.currentLocation.lat, 
            driver.currentLocation.lng
          ));
        }
      });
      map.fitBounds(bounds);
    }
  };

  const createDriverMarkerSVG = (color, initial) => {
    return `
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${color}" stroke="#fff" stroke-width="3"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">${initial}</text>
      </svg>
    `;
  };

  const getDriverStatusColor = (status) => {
    switch (status) {
      case 'active': return '#00ff88';
      case 'on_route': return '#ff9800';
      case 'offline': return '#757575';
      case 'break': return '#2196f3';
      default: return '#9e9e9e';
    }
  };

  const showDriverInfoWindow = (marker, driver) => {
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${driver.name}</h3>
          <p><strong>Status:</strong> ${driver.status}</p>
          <p><strong>Current Job:</strong> ${driver.currentJob || 'None assigned'}</p>
          <p><strong>Speed:</strong> ${driver.currentSpeed || 0} km/h</p>
          <p><strong>Last Update:</strong> ${new Date(driver.lastUpdate).toLocaleTimeString()}</p>
          ${driver.currentJob ? `<p><strong>Progress:</strong> ${driver.jobProgress || 'In transit'}</p>` : ''}
        </div>
      `
    });
    
    infoWindow.open(map, marker);
  };

  const getDriverStatusIcon = (status) => {
    switch (status) {
      case 'active': return <NavigationIcon sx={{ color: '#00ff88' }} />;
      case 'on_route': return <CarIcon sx={{ color: '#ff9800' }} />;
      case 'offline': return <ScheduleIcon sx={{ color: '#757575' }} />;
      case 'break': return <Timer sx={{ color: '#2196f3' }} />;
      default: return <WarningIcon sx={{ color: '#9e9e9e' }} />;
    }
  };

  const focusOnDriver = (driver) => {
    if (map && driver.currentLocation) {
      map.setCenter({
        lat: driver.currentLocation.lat,
        lng: driver.currentLocation.lng
      });
      map.setZoom(15);
      
      const marker = driverMarkers[driver.id];
      if (marker) {
        showDriverInfoWindow(marker, driver);
      }
    }
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'on_route': return 'warning';
      case 'offline': return 'default';
      case 'break': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 2, zIndex: 1000 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <TrackingIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Box>
              <Typography variant="h5" fontWeight="bold">
                Driver Tracking Dashboard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Real-time monitoring of all fleet drivers
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={
                <Switch
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto Refresh"
            />
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Interval</InputLabel>
              <Select
                value={refreshInterval}
                label="Interval"
                onChange={(e) => setRefreshInterval(e.target.value)}
                disabled={!autoRefresh}
              >
                <MenuItem value={3}>3 seconds</MenuItem>
                <MenuItem value={5}>5 seconds</MenuItem>
                <MenuItem value={10}>10 seconds</MenuItem>
                <MenuItem value={30}>30 seconds</MenuItem>
              </Select>
            </FormControl>
            
            <Button
              variant="outlined"
              startIcon={viewMode === 'map' ? <DashboardIcon /> : <MapIcon />}
              onClick={() => setViewMode(viewMode === 'map' ? 'list' : 'map')}
            >
              {viewMode === 'map' ? 'List View' : 'Map View'}
            </Button>
            
            <IconButton 
              onClick={fetchDriversData}
              disabled={loading}
              color="primary"
            >
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      {/* Stats Cards */}
      <Paper elevation={1} sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'primary.light', color: 'white' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h4" fontWeight="bold">
                  {trackingStats.totalDrivers}
                </Typography>
                <Typography variant="body2">Total Drivers</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'success.light', color: 'white' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h4" fontWeight="bold">
                  {trackingStats.activeDrivers}
                </Typography>
                <Typography variant="body2">Active Now</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'warning.light', color: 'white' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h4" fontWeight="bold">
                  {trackingStats.onRoute}
                </Typography>
                <Typography variant="body2">On Route</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={3}>
            <Card sx={{ textAlign: 'center', bgcolor: 'info.light', color: 'white' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="h4" fontWeight="bold">
                  {trackingStats.completedToday}
                </Typography>
                <Typography variant="body2">Completed Today</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Drivers List */}
        <Paper 
          elevation={1} 
          sx={{ 
            width: viewMode === 'list' ? '100%' : 350, 
            borderRadius: 0,
            overflow: 'auto',
            borderRight: viewMode === 'map' ? 1 : 0,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Drivers List ({drivers.length})
            </Typography>
            
            {drivers.length === 0 ? (
              <Alert severity="info">
                No driver data available. Drivers need to sign in to their GPS app.
              </Alert>
            ) : (
              <List>
                {drivers.map((driver) => (
                  <ListItem 
                    key={driver.id}
                    sx={{ 
                      border: 1, 
                      borderColor: 'divider', 
                      borderRadius: 2, 
                      mb: 1,
                      bgcolor: selectedDriver?.id === driver.id ? 'action.selected' : 'background.paper'
                    }}
                  >
                    <ListItemAvatar>
                      <Badge 
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={getDriverStatusIcon(driver.status)}
                      >
                        <Avatar sx={{ 
                          bgcolor: getDriverStatusColor(driver.status),
                          color: 'white'
                        }}>
                          {driver.name.charAt(0)}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Typography variant="subtitle1" fontWeight="600">
                            {driver.name}
                          </Typography>
                          <Chip 
                            label={driver.status} 
                            size="small" 
                            color={getStatusChipColor(driver.status)}
                          />
                        </Stack>
                      }
                      secondary={
                        <Stack spacing={0.5}>
                          <Typography variant="body2" color="text.secondary">
                            Job: {driver.currentJob || 'Not assigned'}
                          </Typography>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="caption">
                              Speed: {driver.currentSpeed || 0} km/h
                            </Typography>
                            <Typography variant="caption">
                              Updated: {driver.lastUpdate ? 
                                new Date(driver.lastUpdate).toLocaleTimeString() : 
                                'Never'
                              }
                            </Typography>
                          </Stack>
                        </Stack>
                      }
                    />
                    
                    {viewMode === 'map' && (
                      <IconButton 
                        onClick={() => focusOnDriver(driver)}
                        disabled={!driver.currentLocation}
                        color="primary"
                      >
                        <LocationIcon />
                      </IconButton>
                    )}
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Paper>

        {/* Map Area */}
        {viewMode === 'map' && (
          <Box sx={{ flex: 1, position: 'relative' }}>
            <div 
              ref={mapRef} 
              style={{ 
                width: '100%', 
                height: '100%',
                borderRadius: 0
              }} 
            />
            
            {/* Map Legend */}
            <Paper
              elevation={3}
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                p: 2,
                minWidth: 200
              }}
            >
              <Typography variant="subtitle2" fontWeight="600" sx={{ mb: 1 }}>
                Driver Status Legend
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: '#00ff88' 
                    }} 
                  />
                  <Typography variant="caption">Active</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: '#ff9800' 
                    }} 
                  />
                  <Typography variant="caption">On Route</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: '#2196f3' 
                    }} 
                  />
                  <Typography variant="caption">On Break</Typography>
                </Stack>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box 
                    sx={{ 
                      width: 12, 
                      height: 12, 
                      borderRadius: '50%', 
                      bgcolor: '#757575' 
                    }} 
                  />
                  <Typography variant="caption">Offline</Typography>
                </Stack>
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default DriverTracker;
