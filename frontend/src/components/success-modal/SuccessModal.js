import PropTypes from 'prop-types';
import { Dialog, Box, Typography, Zoom } from '@mui/material';
import { forwardRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import Iconify from '../iconify';

// ----------------------------------------------------------------------

const Transition = forwardRef((props, ref) => <Zoom ref={ref} {...props} />);

SuccessModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  message: PropTypes.string,
};

export default function SuccessModal({ open, onClose, message }) {
  useEffect(() => {
    let timer;
    let confettiTimer;
    if (open) {
      // Trigger confetti after a short delay during transition
      confettiTimer = setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#8A1B9F', '#FFD700', '#ffffff'],
          gravity: 0.8,
          scalar: 0.7,
          ticks: 300,
          zIndex: 9999, // Ensure it's on top of the dialog
        });
      }, 400);

      timer = setTimeout(() => {
        onClose();
      }, 3000); // 1.5s display + transitions
    }
    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, [open, onClose]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      transitionDuration={800}
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 0,
          textAlign: 'center',
          background: 'transparent', // Light background removed
          color: '#8A1B9F',
          maxWidth: 400,
          width: '100%',
          overflow: 'visible',
          boxShadow: 'none',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'transparent', // No background color
          backdropFilter: 'none', // No blur
        },
      }}
    >
      <Box sx={{ position: 'relative', pt: 6, pb: 6, px: 4 }}>
        {/* Animated Glow Circle */}
        <Box
          sx={{
            width: 120,
            height: 120,
            bgcolor: '#FFD700',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            mb: 4,
            boxShadow: '0 0 30px #FFD700, 0 0 60px rgba(255, 215, 0, 0.4)',
            animation: 'credGlow 4s infinite alternate',
          }}
        >
          <Iconify icon="eva:checkmark-circle-2-fill" width={80} height={80} color="#8A1B9F" />
        </Box>

        <Typography variant="h4" sx={{ mb: 0, fontWeight: '800', letterSpacing: 0.5, color: '#8A1B9F', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          {message}
        </Typography>
      </Box>
    </Dialog>
  );
}
