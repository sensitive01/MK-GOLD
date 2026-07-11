import React, { useState, useEffect } from 'react';
import { 
  Box, Grid, Typography, RadioGroup, FormControlLabel, Radio, 
  TextField, Button, List, ListItem, ListItemText, IconButton, 
  CircularProgress, Paper
} from '@mui/material';
import Iconify from '../../../components/iconify';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for default Leaflet marker icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

function PlainLeafletMap({ locations, onMapClick, isPinMode, onMapReady }) {
  const mapRef = React.useRef(null);
  const mapInstance = React.useRef(null);
  const layerGroup = React.useRef(null);

  React.useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current).setView([20.5937, 78.9629], 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);
      layerGroup.current = L.layerGroup().addTo(mapInstance.current);
      
      mapInstance.current.on('click', (e) => {
        if (mapInstance.current._isPinMode && mapInstance.current._onMapClick) {
          mapInstance.current._onMapClick(e.latlng);
        }
      });
      
      if (onMapReady) {
        onMapReady(mapInstance.current);
      }
    }
  }, []);

  React.useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current._onMapClick = onMapClick;
    }
  }, [onMapClick]);

  React.useEffect(() => {
    if (mapInstance.current) {
      mapInstance.current._isPinMode = isPinMode;
      mapRef.current.style.cursor = isPinMode ? 'crosshair' : '';
    }
  }, [isPinMode]);

  React.useEffect(() => {
    if (layerGroup.current && mapInstance.current) {
      layerGroup.current.clearLayers();
      if (locations && locations.length > 0) {
        const bounds = L.latLngBounds();
        let hasValidLocations = false;
        
        locations.forEach(loc => {
          if (loc.type === 'Location') {
            L.marker([loc.lat, loc.lng]).addTo(layerGroup.current);
            bounds.extend([loc.lat, loc.lng]);
            hasValidLocations = true;
          } else if (loc.type === 'Radius') {
            L.marker([loc.lat, loc.lng]).addTo(layerGroup.current);
            L.circle([loc.lat, loc.lng], {
              radius: loc.radius * 1000,
              color: '#1976d2',
              weight: 2,
              fillColor: '#1976d2',
              fillOpacity: 0.25
            }).addTo(layerGroup.current);
            bounds.extend([loc.lat, loc.lng]);
            hasValidLocations = true;
          }
        });
        
        if (hasValidLocations) {
          mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
      }
    }
  }, [locations]);

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function AudienceLocationPicker({ locations, onChange }) {
  const [inputType, setInputType] = useState('Location');
  const [inputValue, setInputValue] = useState('');
  const [radiusValue, setRadiusValue] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPinMode, setIsPinMode] = useState(false);
  const [locating, setLocating] = useState(false);
  
  const mapInstanceRef = React.useRef(null);

  // Make sure locations is an array
  const safeLocations = Array.isArray(locations) ? locations : [];

  const handleAdd = async () => {
    if (!inputValue.trim()) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        const newLocation = {
          type: inputType,
          name: inputValue,
          radius: inputType === 'Radius' ? Number(radiusValue) : null,
          lat: parseFloat(lat),
          lng: parseFloat(lon),
        };
        onChange([...safeLocations, newLocation]);
        setInputValue('');
      } else {
        setError('Location not found. Try a different search term.');
      }
    } catch (err) {
      setError('Error fetching location data.');
    }
    setLoading(false);
  };

  const handleMapClick = async (latlng) => {
    setIsPinMode(false);
    setLoading(true);
    setError('');
    try {
      // Reverse geocode to get a place name
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}`);
      const data = await response.json();
      
      let placeName = `Pinned Location`;
      if (data && data.display_name) {
        placeName = data.display_name.split(',')[0]; // Use just the first part of the address for brevity
      }
      
      const formattedName = `${placeName} (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`;
      
      const newLocation = {
        type: inputType,
        name: formattedName,
        radius: inputType === 'Radius' ? Number(radiusValue) : null,
        lat: latlng.lat,
        lng: latlng.lng,
      };
      
      onChange([...safeLocations, newLocation]);
    } catch (err) {
      setError('Error fetching pinned location data.');
    }
    setLoading(false);
  };

  const handleRemove = (index) => {
    const newLocations = [...safeLocations];
    newLocations.splice(index, 1);
    onChange(newLocations);
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const { latitude, longitude } = position.coords;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 13);
        }
      },
      () => {
        setLocating(false);
        setError('Unable to retrieve your location');
      }
    );
  };

  return (
    <Box sx={{ p: 2, border: '1px solid #eaeaea', borderRadius: 1 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary' }}>Audience Location</Typography>
      <Grid container spacing={3}>
        {/* Left Side: Form */}
        <Grid item xs={12} md={6}>
          <RadioGroup 
            row 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value)}
            sx={{ mb: 2 }}
          >
            <FormControlLabel value="Location" control={<Radio />} label="Location" />
            <FormControlLabel value="Radius" control={<Radio />} label="Radius" />
          </RadioGroup>

          <Box display="flex" gap={2} mb={2}>
            <TextField
              fullWidth
              size="small"
              label="Enter a place name or address"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            {inputType === 'Radius' && (
              <TextField
                type="number"
                size="small"
                label="Radius (km)"
                value={radiusValue}
                onChange={(e) => setRadiusValue(e.target.value)}
                sx={{ width: 120 }}
              />
            )}
            <Button 
              variant="contained" 
              onClick={handleAdd}
              disabled={loading || !inputValue.trim()}
            >
              {loading ? <CircularProgress size={24} /> : 'Add'}
            </Button>
          </Box>
          
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary">Added Locations</Typography>
            <Box display="flex" gap={1}>
              <Button 
                size="small" 
                variant="outlined" 
                color="inherit"
                onClick={handleCurrentLocation}
                disabled={locating}
                startIcon={<Iconify icon={locating ? "mdi:loading" : "mdi:crosshairs-gps"} />}
              >
                Current Location
              </Button>
              <Button 
                size="small" 
                variant={isPinMode ? "contained" : "outlined"} 
                color={isPinMode ? "primary" : "inherit"}
                onClick={() => setIsPinMode(!isPinMode)}
                startIcon={<Iconify icon="mdi:map-marker-plus" />}
              >
                {isPinMode ? 'Drop Pin...' : 'Pin Mode'}
              </Button>
            </Box>
          </Box>
          <Paper variant="outlined" sx={{ maxHeight: 250, overflow: 'auto' }}>
            <List dense>
              {safeLocations.length === 0 && (
                <ListItem><ListItemText secondary="No locations added yet." /></ListItem>
              )}
              {safeLocations.map((loc, index) => (
                <ListItem 
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" color="error" onClick={() => handleRemove(index)}>
                      <Iconify icon="mdi:close" />
                    </IconButton>
                  }
                >
                  <ListItemText 
                    primary={loc.name} 
                    secondary={loc.type === 'Radius' ? `${loc.radius} km radius` : 'Exact location'} 
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Right Side: Map */}
        <Grid item xs={12} md={6}>
          <Box sx={{ height: 350, width: '100%', borderRadius: 1, overflow: 'hidden', border: isPinMode ? '2px solid #1976d2' : '1px solid #ccc' }}>
            <PlainLeafletMap 
              locations={safeLocations} 
              onMapClick={handleMapClick} 
              isPinMode={isPinMode} 
              onMapReady={(map) => mapInstanceRef.current = map}
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
