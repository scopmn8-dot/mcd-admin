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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Fab,
  Paper,
  Divider,
  CircularProgress,
  TextField,
  DialogActions,
  Avatar,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Navigation as NavigationIcon,
  MyLocation as MyLocationIcon,
  DirectionsCar as CarIcon,
  Place as PlaceIcon,
  Route as RouteIcon,
  Speed as SpeedIcon,
  Timer as TimerIcon,
  Phone as PhoneIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  TrackChanges as TrackingIcon,
  Map as MapIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon
} from '@mui/icons-material';

const DriverGPS = () => {
  // Authentication state
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(false);
  const [currentDriver, setCurrentDriver] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Job and navigation state
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [navigationStarted, setNavigationStarted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Map and directions state
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Statistics
  const [travelStats, setTravelStats] = useState({
    totalDistance: 0,
    estimatedTime: 0,
    currentSpeed: 0,
    timeToDestination: 0
  });

  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  // Initialize Google Maps
  useEffect(() => {
    if (window.google && window.google.maps && mapRef.current && isDriverLoggedIn) {
      initializeMap();
    }
  }, [isDriverLoggedIn]);

  // Check if driver is already logged in
  useEffect(() => {
    const driverToken = localStorage.getItem('driverToken');
    const driverData = localStorage.getItem('driverData');
    
    if (driverToken && driverData) {
      setIsDriverLoggedIn(true);
      setCurrentDriver(JSON.parse(driverData));
      fetchDriverJobs(JSON.parse(driverData));
    }
  }, []);

  const initializeMap = () => {
    const mapInstance = new window.google.maps.Map(mapRef.current, {
      zoom: 13,
      center: { lat: 51.5074, lng: -0.1278 }, // Default to London
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    const directionsServiceInstance = new window.google.maps.DirectionsService();
    const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
      draggable: false,
      panel: null,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#00ff88',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    directionsRendererInstance.setMap(mapInstance);

    setMap(mapInstance);
    setDirectionsService(directionsServiceInstance);
    setDirectionsRenderer(directionsRendererInstance);

    // Get current location
    getCurrentLocation();
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setDriverLocation(location);
          
          if (map) {
            map.setCenter(location);
            
            // Add driver marker
            new window.google.maps.Marker({
              position: location,
              map: map,
              title: 'Your Location',
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#00ff88" stroke="#fff" stroke-width="4"/>
                    <circle cx="20" cy="20" r="8" fill="#fff"/>
                    <circle cx="20" cy="20" r="4" fill="#00ff88"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(40, 40),
                anchor: new window.google.maps.Point(20, 20)
              }
            });
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handleDriverLogin = async () => {
    setLoginError('');
    setLoading(true);

    try {
      const response = await apiFetch('/api/driver/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const data = await response.json();
        
        localStorage.setItem('driverToken', data.token);
        localStorage.setItem('driverData', JSON.stringify(data.driver));
        
        setCurrentDriver(data.driver);
        setIsDriverLoggedIn(true);
        setLoginOpen(false);
        setLoginForm({ username: '', password: '' });
        
        fetchDriverJobs(data.driver);
      } else {
        const errorData = await response.json();
        setLoginError(errorData.error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDriverJobs = async (driver) => {
    try {
      const response = await apiFetch(`/api/driver/jobs/${driver.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('driverToken')}` }
      });

      if (response.ok) {
        const jobs = await response.json();
        setAssignedJobs(jobs.filter(job => job.job_status !== 'completed'));
      }
    } catch (error) {
      console.error('Error fetching driver jobs:', error);
    }
  };

  const startNavigation = (job) => {
    if (!directionsService || !directionsRenderer || !driverLocation) {
      alert('Please wait for map to load and location to be detected');
      return;
    }

    setActiveJob(job);
    setLoading(true);

    const destination = job.collection_full_address || `${job.collection_address_1}, ${job.collection_town_city}, ${job.collection_postcode}`;

    const request = {
      origin: driverLocation,
      destination: destination,
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false
    };

    directionsService.route(request, (result, status) => {
      setLoading(false);
      
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        
        const route = result.routes[0];
        const leg = route.legs[0];
        
        setRouteInfo({
          distance: leg.distance.text,
          duration: leg.duration.text,
          startAddress: leg.start_address,
          endAddress: leg.end_address
        });

        setTravelStats({
          totalDistance: leg.distance.value,
          estimatedTime: leg.duration.value,
          currentSpeed: 0,
          timeToDestination: leg.duration.value
        });

        setNavigationStarted(true);
        startLocationTracking();
      } else {
        alert('Could not calculate route: ' + status);
      }
    });
  };

  const startLocationTracking = () => {
    if (navigator.geolocation && !isTracking) {
      setIsTracking(true);
      
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setDriverLocation(newLocation);
          
          // Update driver location in database
          updateDriverLocation(newLocation, position.coords.speed);
          
          // Update speed
          if (position.coords.speed) {
            setTravelStats(prev => ({
              ...prev,
              currentSpeed: Math.round(position.coords.speed * 3.6) // Convert m/s to km/h
            }));
          }
        },
        (error) => console.error('Location tracking error:', error),
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 1000 
        }
      );
    }
  };

  const updateDriverLocation = async (location, speed = 0) => {
    try {
      await apiFetch('/api/driver/location', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('driverToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lat: location.lat,
          lng: location.lng,
          speed: speed || 0,
          timestamp: new Date().toISOString(),
          activeJobId: activeJob?.job_id
        })
      });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const stopNavigation = () => {
    setNavigationStarted(false);
    setActiveJob(null);
    setIsTracking(false);
    
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (directionsRenderer) {
      directionsRenderer.setDirections({ routes: [] });
    }
    
    setRouteInfo(null);
  };

  const completePickup = async () => {
    if (!activeJob) return;

    try {
      await apiFetch('/api/driver/pickup-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('driverToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: activeJob.job_id,
          location: driverLocation,
          timestamp: new Date().toISOString()
        })
      });

      // Start navigation to delivery address
      const deliveryAddress = activeJob.delivery_full_address || `${activeJob.delivery_address_1}, ${activeJob.delivery_town_city}, ${activeJob.delivery_postcode}`;
      
      const request = {
        origin: driverLocation,
        destination: deliveryAddress,
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK') {
          directionsRenderer.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setRouteInfo({
            distance: leg.distance.text,
            duration: leg.duration.text,
            startAddress: leg.start_address,
            endAddress: leg.end_address,
            phase: 'delivery'
          });
        }
      });

    } catch (error) {
      console.error('Error completing pickup:', error);
    }
  };

  const completeDelivery = async () => {
    if (!activeJob) return;

    try {
      await apiFetch('/api/driver/delivery-complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('driverToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobId: activeJob.job_id,
          location: driverLocation,
          timestamp: new Date().toISOString()
        })
      });

      stopNavigation();
      fetchDriverJobs(currentDriver); // Refresh jobs list
      
    } catch (error) {
      console.error('Error completing delivery:', error);
    }
  };

  const handleDriverLogout = () => {
    localStorage.removeItem('driverToken');
    localStorage.removeItem('driverData');
    setIsDriverLoggedIn(false);
    setCurrentDriver(null);
    setAssignedJobs([]);
    stopNavigation();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!isDriverLoggedIn) {
    return (
      <Box sx={{ p: 3, maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Stack alignItems="center" spacing={3}>
            <Avatar sx={{ 
              width: 64, 
              height: 64, 
              bgcolor: 'primary.main',
              mb: 2
            }}>
              <CarIcon sx={{ fontSize: 32 }} />
            </Avatar>
            
            <Typography variant="h4" fontWeight="bold" textAlign="center">
              Driver GPS Portal
            </Typography>
            
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Sign in with your driver credentials to access navigation and job assignments
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => setLoginOpen(true)}
              fullWidth
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              Driver Sign In
            </Button>
          </Stack>
        </Paper>

        {/* Login Dialog */}
        <Dialog open={loginOpen} onClose={() => setLoginOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Stack direction="row" alignItems="center" spacing={2}>
              <CarIcon color="primary" />
              <Typography variant="h6">Driver Login</Typography>
            </Stack>
          </DialogTitle>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {loginError && (
                <Alert severity="error">{loginError}</Alert>
              )}
              
              <TextField
                label="Driver Username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                fullWidth
                variant="outlined"
              />
              
              <TextField
                label="Password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                fullWidth
                variant="outlined"
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setLoginOpen(false)}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleDriverLogin}
              disabled={loading || !loginForm.username || !loginForm.password}
              startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          zIndex: 1000,
          borderRadius: 0,
          background: 'linear-gradient(135deg, #00ff88 0%, #00cc66 100%)'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ bgcolor: 'white', color: 'black' }}>
              {currentDriver?.name?.charAt(0) || 'D'}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                {currentDriver?.name || 'Driver'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                {navigationStarted ? 'Navigation Active' : 'Ready for Jobs'}
              </Typography>
            </Box>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <IconButton 
              onClick={toggleFullscreen}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
            
            <IconButton 
              onClick={() => fetchDriverJobs(currentDriver)}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <RefreshIcon />
            </IconButton>
            
            <IconButton 
              onClick={handleDriverLogout}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Paper>

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Jobs Panel - Hide in fullscreen */}
        {!isFullscreen && (
          <Paper 
            elevation={1} 
            sx={{ 
              width: 350, 
              borderRadius: 0,
              overflow: 'auto',
              borderRight: 1,
              borderColor: 'divider'
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Your Jobs ({assignedJobs.length})
              </Typography>
              
              {assignedJobs.length === 0 ? (
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  No jobs assigned. Check back later or contact dispatch.
                </Alert>
              ) : (
                <Stack spacing={2}>
                  {assignedJobs.map((job) => (
                    <Card 
                      key={job.job_id}
                      elevation={activeJob?.job_id === job.job_id ? 3 : 1}
                      sx={{ 
                        borderRadius: 2,
                        border: activeJob?.job_id === job.job_id ? 2 : 0,
                        borderColor: 'primary.main',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Stack spacing={1}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight="600">
                              {job.job_id}
                            </Typography>
                            <Chip 
                              label={job.job_status || 'pending'} 
                              size="small" 
                              color={job.job_status === 'active' ? 'primary' : 'default'}
                            />
                          </Stack>
                          
                          <Typography variant="body2" color="text.secondary">
                            Vehicle: {job.VRM}
                          </Typography>
                          
                          <Box>
                            <Typography variant="caption" color="primary.main" fontWeight="600">
                              PICKUP:
                            </Typography>
                            <Typography variant="body2">
                              {job.collection_full_address || `${job.collection_address_1}, ${job.collection_town_city}`}
                            </Typography>
                          </Box>
                          
                          <Box>
                            <Typography variant="caption" color="secondary.main" fontWeight="600">
                              DELIVERY:
                            </Typography>
                            <Typography variant="body2">
                              {job.delivery_full_address || `${job.delivery_address_1}, ${job.delivery_town_city}`}
                            </Typography>
                          </Box>
                          
                          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            {activeJob?.job_id === job.job_id ? (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={stopNavigation}
                                fullWidth
                              >
                                Stop Navigation
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<NavigationIcon />}
                                onClick={() => startNavigation(job)}
                                fullWidth
                                disabled={loading}
                              >
                                Start Navigation
                              </Button>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        )}

        {/* Map Area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <div 
            ref={mapRef} 
            style={{ 
              width: '100%', 
              height: '100%',
              borderRadius: 0
            }} 
          />
          
          {/* Navigation Info Overlay */}
          {navigationStarted && routeInfo && (
            <Paper 
              elevation={3}
              sx={{ 
                position: 'absolute',
                top: 16,
                left: 16,
                right: isFullscreen ? 16 : 'auto',
                width: isFullscreen ? 'auto' : 300,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight="600" color="primary.main">
                  {routeInfo.phase === 'delivery' ? '🚛 To Delivery' : '📍 To Pickup'}
                </Typography>
                
                <Stack direction="row" spacing={2}>
                  <Chip 
                    icon={<RouteIcon />}
                    label={routeInfo.distance}
                    size="small"
                    variant="outlined"
                  />
                  <Chip 
                    icon={<TimerIcon />}
                    label={routeInfo.duration}
                    size="small"
                    variant="outlined"
                  />
                  {travelStats.currentSpeed > 0 && (
                    <Chip 
                      icon={<SpeedIcon />}
                      label={`${travelStats.currentSpeed} km/h`}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Stack>
                
                <Typography variant="body2" color="text.secondary">
                  {routeInfo.endAddress}
                </Typography>
                
                <Stack direction="row" spacing={1}>
                  {routeInfo.phase !== 'delivery' ? (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={completePickup}
                      color="success"
                      fullWidth
                    >
                      Complete Pickup
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={completeDelivery}
                      color="success"
                      fullWidth
                    >
                      Complete Delivery
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Paper>
          )}
          
          {/* Location Button */}
          <Fab
            color="primary"
            size="medium"
            onClick={getCurrentLocation}
            sx={{
              position: 'absolute',
              bottom: 24,
              right: 24,
              bgcolor: 'primary.main',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <MyLocationIcon />
          </Fab>
          
          {/* Tracking Indicator */}
          {isTracking && (
            <Paper
              elevation={2}
              sx={{
                position: 'absolute',
                bottom: 24,
                left: 24,
                p: 1,
                borderRadius: 2,
                bgcolor: 'success.main',
                color: 'white'
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <TrackingIcon sx={{ fontSize: 20, animation: 'pulse 2s infinite' }} />
                <Typography variant="caption" fontWeight="600">
                  Live Tracking ON
                </Typography>
              </Stack>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DriverGPS;
