import React, { useRef, useEffect, useState } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
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

export default function MapPicker({ lat, lng, setFieldValue }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerInstance = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      // Initialize map
      const defaultLat = lat ? parseFloat(lat) : 20.5937;
      const defaultLng = lng ? parseFloat(lng) : 78.9629;
      
      mapInstance.current = L.map(mapRef.current).setView([defaultLat, defaultLng], lat ? 13 : 4);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapInstance.current);

      if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        markerInstance.current = L.marker([parseFloat(lat), parseFloat(lng)]).addTo(mapInstance.current);
      }

      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setFieldValue('latitude', lat.toFixed(6));
        setFieldValue('longitude', lng.toFixed(6));
        
        if (markerInstance.current) {
          markerInstance.current.setLatLng([lat, lng]);
        } else {
          markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current);
        }
      });
      
      // Robust fix for Leaflet gray tile rendering issue
      const resizeObserver = new ResizeObserver(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      });
      resizeObserver.observe(mapRef.current);
      
      // Store observer on ref so we can disconnect it
      mapRef.current._resizeObserver = resizeObserver;
      
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
        }
      }, 500);
    }
    
    return () => {
      if (mapRef.current && mapRef.current._resizeObserver) {
        mapRef.current._resizeObserver.disconnect();
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []); // Run once on mount

  // Update marker if lat/lng change from outside (e.g. typing)
  useEffect(() => {
    if (mapInstance.current && lat && lng) {
      const parsedLat = parseFloat(lat);
      const parsedLng = parseFloat(lng);
      
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        if (markerInstance.current) {
          markerInstance.current.setLatLng([parsedLat, parsedLng]);
        } else {
          markerInstance.current = L.marker([parsedLat, parsedLng]).addTo(mapInstance.current);
        }
        mapInstance.current.setView([parsedLat, parsedLng], mapInstance.current.getZoom());
      }
    }
  }, [lat, lng]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLoading(false);
        const { latitude, longitude } = position.coords;
        
        setFieldValue('latitude', latitude.toFixed(6));
        setFieldValue('longitude', longitude.toFixed(6));
        
        if (mapInstance.current) {
          mapInstance.current.flyTo([latitude, longitude], 15);
        }
      },
      () => {
        setLoading(false);
        setError('Unable to retrieve your location');
      }
    );
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Click on the map to drop a pin
        </Typography>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={handleCurrentLocation}
          disabled={loading}
          startIcon={loading && <CircularProgress size={16} />}
        >
          Use Current Location
        </Button>
      </Box>
      {error && (
        <Typography color="error" variant="caption" display="block" mb={1}>
          {error}
        </Typography>
      )}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '350px', 
          borderRadius: '8px', 
          border: '1px solid #ccc',
          position: 'relative',
          zIndex: 0 
        }} 
      />
    </Box>
  );
}
