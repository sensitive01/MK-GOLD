import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getMyNotifications, markNotificationSeen } from '../../apis/notificationManagement';
import global from '../../utils/global';

const THEME_COLORS = {
  primary: { bg: '#5b21b6', text: '#ffffff' },
  gold: { bg: '#d97706', text: '#ffffff' },
  error: { bg: '#dc2626', text: '#ffffff' },
  warning: { bg: '#ea580c', text: '#ffffff' },
  info: { bg: '#0284c7', text: '#ffffff' },
  dark: { bg: '#1e293b', text: '#ffffff' },
};

const SPEED_MAP = {
  slow: '3',
  normal: '5',
  fast: '8',
};

export default function NotificationBannerAndModal() {
  const [notifications, setNotifications] = useState([]);
  const [currentPop, setCurrentPop] = useState(null);
  const [dismissedPopIds, setDismissedPopIds] = useState([]);
  const [dismissedScrollIds, setDismissedScrollIds] = useState([]);

  const fetchActiveNotifications = async () => {
    try {
      const res = await getMyNotifications();
      if (res && res.status && Array.isArray(res.data)) {
        setNotifications(res.data);
        // Find first unseen pop-up
        const firstPop = res.data.find(
          (n) => n.notificationType === 'popup' && !n.isSeen
        );
        if (firstPop) {
          setCurrentPop(firstPop);
        }
      }
    } catch (err) {
      console.error('Failed to fetch user notifications:', err);
    }
  };

  useEffect(() => {
    fetchActiveNotifications();
  }, []);

  // Cycle through unseen popups
  useEffect(() => {
    if (!currentPop && Array.isArray(notifications)) {
      const nextPop = notifications.find(
        (n) =>
          n.notificationType === 'popup' &&
          !n.isSeen &&
          !dismissedPopIds.includes(n._id)
      );
      if (nextPop) {
        setCurrentPop(nextPop);
      }
    }
  }, [notifications, currentPop, dismissedPopIds]);

  const handleDismissScroll = (id) => {
    setDismissedScrollIds((prev) => [...prev, id]);
  };

  const handleDismissPop = () => {
    if (currentPop) {
      setDismissedPopIds((prev) => [...prev, currentPop._id]);
    }
    setCurrentPop(null);
  };

  const handleMarkSeenPop = async (id, actionUrl) => {
    try {
      await markNotificationSeen(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isSeen: true } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification seen:', err);
    }
    if (currentPop && currentPop._id === id) {
      setCurrentPop(null);
    }
    if (actionUrl) {
      if (actionUrl.startsWith('http')) {
        window.open(actionUrl, '_blank');
      } else {
        window.location.href = actionUrl;
      }
    }
  };

  const activeScrolls = Array.isArray(notifications)
    ? notifications.filter(
        (n) =>
          n.notificationType === 'scroll' &&
          !dismissedScrollIds.includes(n._id)
      )
    : [];

  return (
    <>
      {/* 1. SCROLLING MARQUEE BANNER */}
      {activeScrolls.length > 0 && (
        <Box
          sx={{
            width: '100%',
            mb: 2,
            gap: 1,
            borderRadius: 1.5,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeScrolls.map((s) => {
            const theme = THEME_COLORS[s.themeColor] || THEME_COLORS.primary;
            const speed = SPEED_MAP[s.scrollSpeed] || '5';

            return (
              <Box
                key={s._id}
                sx={{
                  bgcolor: theme.bg,
                  color: theme.text,
                  py: 1,
                  borderRadius: 1.5,
                  px: 2,
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                }}
              >
                <Box
                  component="marquee"
                  behavior="scroll"
                  direction="left"
                  scrollamount={speed}
                  onMouseEnter={(e) => e.target.stop()}
                  onMouseLeave={(e) => e.target.start()}
                  sx={{
                    flexGrow: 1,
                    fontSize: '0.925rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    mr: 2,
                  }}
                >
                  <span style={{ marginRight: '60px' }}>
                    📢 {s.content}
                  </span>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDismissScroll(s._id)}
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.6)',
                    py: 0.2,
                    px: 1.2,
                    fontSize: '0.75rem',
                    textTransform: 'none',
                    flexShrink: 0,
                    '&:hover': {
                      borderColor: '#fff',
                      bgcolor: 'rgba(255,255,255,0.1)',
                    },
                  }}
                >
                  Got it
                </Button>
              </Box>
            );
          })}
        </Box>
      )}

      {/* 2. POP-UP MODAL DIALOG */}
      <Dialog
        open={Boolean(currentPop)}
        onClose={handleDismissPop}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          },
        }}
      >
        {currentPop && (
          <>
            <DialogTitle
              sx={{
                p: 2.2,
                bgcolor: '#5b21b6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {currentPop.title || 'Notification'}
              </Typography>
              <IconButton size="small" onClick={handleDismissPop} sx={{ color: '#fff' }}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ p: 3 }}>
              {/* Image if available */}
              {(currentPop.file?.uploadedFile || currentPop.image) && (
                <Box sx={{ mb: 2.5, textAlign: 'center' }}>
                  <Box
                    component="img"
                    src={
                      (currentPop.file?.uploadedFile || currentPop.image).startsWith('http')
                        ? currentPop.file?.uploadedFile || currentPop.image
                        : `${global.baseURL}/${currentPop.file?.uploadedFile || currentPop.image}`
                    }
                    alt="announcement"
                    sx={{
                      maxWidth: '100%',
                      maxHeight: 280,
                      borderRadius: 2,
                      objectFit: 'contain',
                    }}
                  />
                </Box>
              )}

              {/* Description body */}
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b', lineHeight: 1.6 }}>
                {currentPop.description}
              </Typography>
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Button onClick={handleDismissPop} color="inherit">
                Close
              </Button>
              <Button
                variant="contained"
                onClick={() => handleMarkSeenPop(currentPop._id, currentPop.actionUrl)}
                sx={{
                  bgcolor: '#FFD700',
                  color: '#000',
                  fontWeight: 700,
                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.35)',
                  '&:hover': { bgcolor: '#e6c200', color: '#000' },
                  px: 3,
                }}
              >
                {currentPop.actionText || 'Got it'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

