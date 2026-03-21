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
import { getMyAnnouncements, markAsSeen } from '../../apis/announcement';
import global from '../../utils/global';

function NotificationDisplay() {
  const [announcements, setAnnouncements] = useState([]);
  const [currentPop, setCurrentPop] = useState(null);
  const [dismissedIds, setDismissedIds] = useState([]);

  const fetchAnnouncements = async () => {
    const res = await getMyAnnouncements();
    if (res.status) {
      setAnnouncements(res.data);
      // Find the first 'pop' type announcement that is NOT yet seen
      const pop = res.data.find((a) => a.notificationType === 'pop' && !a.isSeen);
      if (pop) {
        setCurrentPop(pop);
      }
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSeen = async (id) => {
    const res = await markAsSeen(id);
    if (res.status) {
      setAnnouncements((prev) => 
        prev.map((a) => (a._id === id ? { ...a, isSeen: true } : a))
      );
      if (currentPop && currentPop._id === id) {
        setCurrentPop(null);
      }
    }
  };

  useEffect(() => {
    if (!currentPop) {
      const nextPop = announcements.find((a) => 
        a.notificationType === 'pop' && 
        !a.isSeen && 
        !dismissedIds.includes(a._id)
      );
      if (nextPop) {
        setCurrentPop(nextPop);
      }
    }
  }, [announcements, currentPop, dismissedIds]);

  const handleClose = () => {
    if (currentPop) {
      setDismissedIds((prev) => [...prev, currentPop._id]);
    }
    setCurrentPop(null);
  };

  const scrolls = announcements.filter((a) => a.notificationType === 'scroll' && !a.isSeen);

  return (
    <>
      {/* Scrollable Marquee */}
      {scrolls.length > 0 && (
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: '#fff',
            py: 1,
            px: 2,
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            overflow: 'hidden',
          }}
        >
          <Box
            component="marquee"
            behavior="scroll"
            direction="left"
            scrollamount="5"
            sx={{
              display: 'block',
              width: '100%',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {scrolls.map((s, index) => (
              <span key={s._id} style={{ marginRight: '100px' }}>
                {s.image && (
                   <img 
                    src={s.image.startsWith('http') ? s.image : `${global.baseURL}/${s.image}`} 
                    alt="icon" 
                    style={{ height: '24px', verticalAlign: 'middle', marginRight: '10px' }} 
                   />
                )}
                {s.title}: {s.description}
                <Button 
                  size="small" 
                  variant="outlined" 
                  color="inherit" 
                  sx={{ ml: 2, borderColor: '#fff' }} 
                  onClick={() => handleSeen(s._id)}
                >
                  Got it
                </Button>
              </span>
            ))}
          </Box>
        </Box>
      )}

      {/* Pop-up Dialog */}
      <Dialog
        open={Boolean(currentPop)}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
          }
        }}
      >
        {currentPop && (
          <>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: 'primary.main', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{currentPop.title}</Typography>
              <IconButton
                aria-label="close"
                onClick={handleClose}
                sx={{ color: '#fff' }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              {currentPop.file?.uploadedFile && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <img
                    src={currentPop.file.uploadedFile.startsWith('http') ? currentPop.file.uploadedFile : `${global.baseURL}/${currentPop.file.uploadedFile}`}
                    alt="announcement"
                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px' }}
                  />
                </Box>
              )}
              <Typography gutterBottom variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {currentPop.description}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleClose} color="inherit">
                Close
              </Button>
              <Button onClick={() => handleSeen(currentPop._id)} variant="contained" autoFocus>
                Mark as Seen
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
}

export default NotificationDisplay;
