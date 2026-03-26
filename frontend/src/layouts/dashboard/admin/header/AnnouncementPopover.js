import { useState, useEffect } from 'react';
// @mui
import {
  Box,
  List,
  Badge,
  Button,
  Avatar,
  Divider,
  Popover,
  Typography,
  IconButton,
  ListItemText,
  ListItemAvatar,
  ListItemButton,
  Tooltip,
} from '@mui/material';
// components
import Iconify from '../../../../components/iconify';
import Scrollbar from '../../../../components/scrollbar';
import { getMyAnnouncements, markAsSeen } from '../../../../apis/announcement';
import { fToNow } from '../../../../utils/formatTime';
import global from '../../../../utils/global';

export default function AnnouncementPopover() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(null);

  const fetchData = async () => {
    const res = await getMyAnnouncements();
    console.log('Announcement Response:', res);
    if (res.status === true || res.status === 200) {
      setNotifications(res.data);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOpen = (event) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const handleMarkAsSeen = async (id) => {
    const res = await markAsSeen(id);
    if (res.status) {
      setNotifications((prev) => 
        prev?.map((n) => (n._id === id ? { ...n, isSeen: true } : n))
      );
    }
  };

  const unreadCount = notifications?.filter((n) => !n.isSeen)?.length;

  return (
    <>
      <IconButton 
        color={open ? 'primary' : 'inherit'} 
        onClick={handleOpen} 
        sx={{ width: 40, height: 40, color: '#fff' }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <Iconify icon="eva:bell-fill" />
        </Badge>
      </IconButton>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            ml: 0.75,
            width: 360,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Announcements</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You have {unreadCount} unread announcements
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Scrollbar sx={{ height: { xs: 340, sm: 'auto' }, maxHeight: 400 }}>
          <List disablePadding>
            {notifications?.length === 0 && (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  No announcements
                </Typography>
              </Box>
            )}
            {notifications?.map((notification) => (
              <ListItemButton
                key={notification._id}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  mt: '1px',
                  bgcolor: notification.isSeen ? 'transparent' : 'action.selected',
                }}
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: 'background.neutral' }}>
                    {notification.file?.uploadedFile ? (
                       <img 
                        src={notification.file.uploadedFile.startsWith('http') ? notification.file.uploadedFile : `${global.baseURL}/${notification.file.uploadedFile}`} 
                        alt="icon" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: notification.isSeen ? 0.6 : 1 }}
                       />
                    ) : (
                       <Iconify icon="eva:file-text-fill" color={notification.isSeen ? 'text.disabled' : 'primary.main'} />
                    )}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle2" sx={{ color: notification.isSeen ? 'text.secondary' : 'text.primary' }}>
                      {notification.title}
                      <Typography component="span" variant="body2" sx={{ color: 'text.secondary', display: 'block' }}>
                        {notification.description?.substring(0, 50)}{notification.description?.length > 50 ? '...' : ''}
                      </Typography>
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        mt: 0.5,
                        display: 'flex',
                        alignItems: 'center',
                        color: 'text.disabled',
                      }}
                    >
                      <Iconify icon="eva:clock-outline" sx={{ mr: 0.5, width: 16, height: 16 }} />
                      {fToNow(notification.createdAt)}
                    </Typography>
                  }
                />
                {!notification.isSeen && (
                  <Tooltip title="Mark as read">
                    <IconButton edge="end" onClick={() => handleMarkAsSeen(notification._id)}>
                      <Iconify icon="eva:done-all-fill" />
                    </IconButton>
                  </Tooltip>
                )}
              </ListItemButton>
            ))}
          </List>
        </Scrollbar>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button fullWidth disableRipple onClick={handleClose}>
            Close
          </Button>
        </Box>
      </Popover>
    </>
  );
}

