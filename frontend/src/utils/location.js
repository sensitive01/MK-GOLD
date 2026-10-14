import React from 'react';
import { Box, Link, Stack, Typography, CircularProgress, Button } from '@mui/material';
import Iconify from '../components/iconify';

export const getDetailedLocation = () =>
  new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return resolve({
        success: false,
        error: 'Geolocation is not supported by your browser or device.',
      });
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        let address = '';
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { 'Accept-Language': 'en' },
            }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const parts = [
              addr.suburb || addr.neighbourhood || addr.road || '',
              addr.city || addr.town || addr.village || addr.county || '',
              addr.state || '',
            ].filter(Boolean);
            address = parts.join(', ') || data.display_name?.split(',').slice(0, 3).join(',') || '';
          }
        } catch (e) {
          console.error('Reverse geocode error:', e);
        }

        resolve({
          success: true,
          data: {
            latitude,
            longitude,
            accuracy: Math.round(accuracy),
            address: address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            mapsUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
          },
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
        let msg = 'Unable to retrieve location.';
        if (err.code === 1) {
          msg = 'Location access was denied. Please allow location permissions in your browser or device settings to proceed.';
        } else if (err.code === 2) {
          msg = 'Location unavailable. Please make sure your device GPS/location is turned on.';
        } else if (err.code === 3) {
          msg = 'Location request timed out. Please click Retry.';
        }
        resolve({
          success: false,
          error: msg,
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  });

export const getCurrentLocation = async () => {
  const result = await getDetailedLocation();
  return result.success ? result.data : null;
};

export const LogoutLocationStatus = ({ loading, location, error, onRetry }) => {
  if (loading) {
    return (
      <Box
        sx={{
          my: 2,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: 'rgba(0, 0, 0, 0.04)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <CircularProgress size={18} />
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Detecting your location for logout... (Mandatory)
        </Typography>
      </Box>
    );
  }

  if (location && location.latitude) {
    return (
      <Box
        sx={{
          my: 2,
          p: 1.5,
          borderRadius: 1.5,
          bgcolor: 'rgba(46, 125, 50, 0.08)',
          border: '1px solid rgba(46, 125, 50, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
        }}
      >
        <Iconify icon="material-symbols:location-on" sx={{ color: 'success.main', width: 22, height: 22, flexShrink: 0 }} />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: 'success.dark',
              fontWeight: 700,
              display: 'block',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Logout Location Verified
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap title={location.address}>
            {location.address}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary', fontFamily: 'monospace', display: 'block', mt: 0.2 }}
          >
            {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        my: 2,
        p: 1.5,
        borderRadius: 1.5,
        bgcolor: 'rgba(211, 47, 47, 0.08)',
        border: '1px solid rgba(211, 47, 47, 0.3)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.5,
      }}
    >
      <Iconify icon="mdi:map-marker-off" sx={{ color: 'error.main', width: 22, height: 22, flexShrink: 0, mt: 0.2 }} />
      <Box sx={{ flexGrow: 1 }}>
        <Typography
          variant="caption"
          sx={{
            color: 'error.main',
            fontWeight: 700,
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Location Required to Logout
        </Typography>
        <Typography variant="body2" sx={{ color: 'error.main', fontSize: '0.82rem', mt: 0.3, mb: 1 }}>
          {error || 'Location access is mandatory to logout. Please turn on device GPS and allow browser location access.'}
        </Typography>
        {onRetry && (
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={onRetry}
            sx={{ textTransform: 'none', py: 0.4, px: 1.5, fontSize: '0.75rem' }}
          >
            Retry Location
          </Button>
        )}
      </Box>
    </Box>
  );
};

export const AttendanceLocation = ({ location }) => {
  if (!location || !location.latitude) return null;
  return (
    <Box sx={{ mt: 0.5, minWidth: 140 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Iconify
          icon="material-symbols:location-on"
          sx={{ color: 'error.main', width: 14, height: 14, flexShrink: 0 }}
        />
        <Link
          href={location.mapsUrl || `https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'primary.main',
            textDecoration: 'none',
            '&:hover': { textDecoration: 'underline' },
            display: 'block',
            maxWidth: 180,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={`${location.address || ''} - Click to view in Google Maps`}
        >
          {location.address || 'View on Map'}
        </Link>
      </Stack>
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: 'text.secondary',
          fontSize: '0.68rem',
          fontFamily: 'monospace',
          fontWeight: 500,
          ml: 2.2,
          mt: 0.2,
        }}
      >
        {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}
      </Typography>
    </Box>
  );
};
