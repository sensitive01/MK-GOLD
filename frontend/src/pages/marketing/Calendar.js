import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Avatar,
  InputBase,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  isBefore,
  startOfDay,
} from 'date-fns';

export default function MarketingCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [openCreate, setOpenCreate] = useState(false);
  const [activeTab, setActiveTab] = useState('Month');
  const [events, setEvents] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', date: '', mediaFile: null });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fetchEvents = async () => {
    try {
      // Assuming a generic API setup, replace with your actual fetcher if using RTK query or similar
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1.0/schedule`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } // basic auth header if needed
      });
      if (res.data && res.data.status) {
        setEvents(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch schedules", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async () => {
    setIsSubmitting(true);
    try {
      let finalFormData = { ...formData };
      
      if (formData.mediaFile) {
        const filePayload = new FormData();
        filePayload.append('uploadedFile', formData.mediaFile);
        filePayload.append('uploadId', '60c72b2f5f1b2c001f3e5c9a');
        filePayload.append('uploadName', 'schedule_media');
        const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1.0/public/kyc/file-upload`, filePayload, {
          headers: { 
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        if (uploadRes.data?.status && uploadRes.data?.data) {
          finalFormData.mediaUrl = uploadRes.data.data.uploadedFile;
        }
      }
      
      delete finalFormData.mediaFile;

      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/v1.0/schedule/${editId}`, finalFormData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1.0/schedule`, finalFormData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
      }
      
      setOpenCreate(false);
      setEditId(null);
      setFormData({ title: '', description: '', date: '', mediaFile: null });
      fetchEvents(); // refresh
    } catch (err) {
      console.error("Failed to save schedule", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (schedule) => {
    setEditId(schedule._id);
    setFormData({ 
      title: schedule.title, 
      description: schedule.description || '', 
      date: format(new Date(schedule.date), 'yyyy-MM-dd'),
      mediaFile: null 
    });
    setOpenCreate(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1.0/schedule/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchEvents();
      } catch (err) {
        console.error("Failed to delete schedule", err);
      }
    }
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  // Generate calendar days based on activeTab
  let days = [];
  if (activeTab === 'Day') {
    days = [currentDate];
  } else if (activeTab === 'Week') {
    let day = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
  } else if (activeTab === 'Month') {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    let day = startOfWeek(monthStart);
    const end = endOfWeek(monthEnd);
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
  }
  // For 'Year', we'll handle rendering separately.

  const monthStart = startOfMonth(currentDate); // Still useful for active month coloring


  const getEventsForDate = (dateStr) => {
    return events.filter(e => format(new Date(e.date), 'yyyy-MM-dd') === dateStr).map((e, idx) => ({
      ...e,
      color: ['#b388ff', '#d500f9', '#ab47bc', '#7e57c2', '#9c27b0'][idx % 5] // cycle colors
    }));
  };

  const renderCells = () => {
    return days.map((day, i) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayEvents = getEventsForDate(dateStr);
      const isCurrentMonth = isSameMonth(day, monthStart);
      const isToday = isSameDay(day, new Date());

      return (
        <Box
          key={i}
          sx={{
            minHeight: 120,
            borderBottom: '1px solid #f0f0f0',
            borderRight: '1px solid #f0f0f0',
            p: 1,
            opacity: isCurrentMonth ? 1 : 0.4,
            display: 'flex',
            flexDirection: 'column',
            cursor: 'pointer',
            '&:hover': { bgcolor: '#fafafa' }
          }}
          onClick={() => {
            if (isBefore(day, startOfDay(new Date()))) {
              // Optionally show a toast/alert, but for now just prevent action
              return;
            }
            setEditId(null);
            setFormData({ title: '', description: '', date: dateStr, mediaFile: null });
            setOpenCreate(true);
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? '#9c27b0' : 'text.primary',
                borderBottom: isToday ? '2px solid #9c27b0' : 'none',
                pb: 0.5,
              }}
            >
              {format(day, 'dd')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {dayEvents.map((ev, idx) => (
              <Box
                key={idx}
                sx={{
                  bgcolor: ev.color,
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 600,
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  textAlign: 'center',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  '&:hover': { opacity: 0.9 }
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(ev);
                }}
              >
                {ev.title}
              </Box>
            ))}
            {dayEvents.length > 2 && (
              <Typography variant="caption" sx={{ textAlign: 'center', color: '#9c27b0', fontSize: '10px', mt: 0.5 }}>
                More
              </Typography>
            )}
          </Box>
        </Box>
      );
    });
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => new Date(currentDate.getFullYear(), i, 1));
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, p: 2 }}>
        {months.map((month, i) => (
          <Box key={i} sx={{ border: '1px solid #f0f0f0', borderRadius: 2, p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, textAlign: 'center', color: '#9c27b0' }}>
              {format(month, 'MMMM')}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, textAlign: 'center' }}>
              {['S','M','T','W','T','F','S'].map(d => <Typography key={d} variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{d}</Typography>)}
              {Array.from({ length: endOfWeek(endOfMonth(month)).getDate() + startOfWeek(month).getDate() + 30 /* rough approximation for loop */ }).slice(0, 0).map(()=> null) /* We can use date-fns instead */ }
              
              {(() => {
                const start = startOfWeek(month);
                const end = endOfWeek(endOfMonth(month));
                const monthDays = [];
                let d = start;
                while (d <= end) { monthDays.push(d); d = addDays(d, 1); }
                return monthDays.map((md, idx) => {
                  const hasEvents = getEventsForDate(format(md, 'yyyy-MM-dd')).length > 0;
                  return (
                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{
                        width: 24, height: 24, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        color: isSameMonth(md, month) ? 'text.primary' : 'text.disabled',
                        bgcolor: hasEvents ? '#f3e5f5' : 'transparent',
                        borderRadius: '50%',
                        fontWeight: hasEvents ? 'bold' : 'normal'
                      }}>
                        {format(md, 'd')}
                      </Typography>
                    </Box>
                  );
                });
              })()}
            </Box>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ pb: 3, pt: 1 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Calendar</Typography>
        <Box sx={{ display: 'flex', gap: 1, bgcolor: '#f5f5f5', p: 0.5, borderRadius: 2 }}>
          {['Day', 'Week', 'Month', 'Year'].map(tab => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'contained' : 'text'}
              sx={{
                bgcolor: activeTab === tab ? '#9c27b0' : 'transparent',
                color: activeTab === tab ? 'white' : 'text.secondary',
                '&:hover': {
                  bgcolor: activeTab === tab ? '#7b1fa2' : 'rgba(0,0,0,0.04)',
                },
                textTransform: 'none',
                borderRadius: 1.5,
                px: 3,
                boxShadow: activeTab === tab ? 2 : 0,
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </Button>
          ))}
        </Box>
      </Box>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={3.5} lg={3}>
          <Paper sx={{ p: 3, borderRadius: 4, mb: 3, boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add sx={{ color: '#ffffff !important' }} />}
              sx={{ bgcolor: '#9c27b0', color: 'white', '&:hover': { bgcolor: '#7b1fa2' }, borderRadius: 2, py: 1.5, mb: 4, textTransform: 'none', fontSize: '16px', fontWeight: 600, boxShadow: '0 8px 16px 0 rgba(156, 39, 176, 0.24)' }}
              onClick={() => {
                setEditId(null);
                const todayStr = format(new Date(), 'yyyy-MM-dd');
                setFormData({ title: '', description: '', date: todayStr, mediaFile: null });
                setOpenCreate(true);
              }}
            >
              Create Schedule
            </Button>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Schedules</Typography>
            
            <List disablePadding>
              {events.length > 0 ? events.map((schedule, i) => (
                <ListItem key={i} disablePadding sx={{ mb: 2.5, alignItems: 'center' }}>
                  <ListItemAvatar sx={{ minWidth: 50 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: ['#b388ff', '#d500f9', '#ab47bc', '#7e57c2', '#9c27b0'][i % 5] }}>
                      {schedule.title[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{schedule.title}</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{format(new Date(schedule.date), 'MMM d, yyyy')}</Typography>}
                  />
                  <Box>
                    <IconButton size="small" onClick={() => handleEditClick(schedule)}>
                      <Edit fontSize="small" color="action" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(schedule._id)}>
                      <Delete fontSize="small" color="error" />
                    </IconButton>
                  </Box>
                </ListItem>
              )) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center', py: 4 }}>
                  No schedules created yet.
                </Typography>
              )}
            </List>


          </Paper>
        </Grid>

        {/* Right Calendar Area */}
        <Grid item xs={12} md={8.5} lg={9}>
          <Paper sx={{ pt: 2, pb: 4, px: 0, borderRadius: 4, height: '100%', boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)' }}>
            {/* Calendar Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 4, mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {activeTab === 'Year' ? format(currentDate, 'yyyy') : format(currentDate, 'MMMM d, yyyy')}
              </Typography>
              <Box>
                <IconButton onClick={() => {
                  if (activeTab === 'Day') setCurrentDate(addDays(currentDate, -1));
                  else if (activeTab === 'Week') setCurrentDate(addDays(currentDate, -7));
                  else if (activeTab === 'Month') setCurrentDate(subMonths(currentDate, 1));
                  else if (activeTab === 'Year') setCurrentDate(new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), 1));
                }} size="small"><ChevronLeft /></IconButton>
                <IconButton onClick={() => {
                  if (activeTab === 'Day') setCurrentDate(addDays(currentDate, 1));
                  else if (activeTab === 'Week') setCurrentDate(addDays(currentDate, 7));
                  else if (activeTab === 'Month') setCurrentDate(addMonths(currentDate, 1));
                  else if (activeTab === 'Year') setCurrentDate(new Date(currentDate.getFullYear() + 1, currentDate.getMonth(), 1));
                }} size="small"><ChevronRight /></IconButton>
              </Box>
            </Box>

            {activeTab !== 'Year' && (
              <>
                {/* Days of week */}
                <Box sx={{ display: 'grid', gridTemplateColumns: activeTab === 'Day' ? '1fr' : 'repeat(7, 1fr)', mb: 2, px: 2 }}>
                  {(activeTab === 'Day' ? [format(currentDate, 'EEEE')] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']).map(day => (
                    <Typography key={day} variant="subtitle2" sx={{ textAlign: 'center', fontWeight: 700, color: '#333' }}>
                      {day}
                    </Typography>
                  ))}
                </Box>

                {/* Calendar Grid */}
                <Box sx={{ display: 'grid', gridTemplateColumns: activeTab === 'Day' ? '1fr' : 'repeat(7, 1fr)', borderTop: '1px solid #f0f0f0', borderLeft: '1px solid #f0f0f0', mx: 2, borderRadius: 2, overflow: 'hidden' }}>
                  {renderCells()}
                </Box>
              </>
            )}

            {activeTab === 'Year' && renderYearView()}
          </Paper>
        </Grid>
      </Grid>

      {/* Create Schedule Dialog */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>{editId ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 2 }}>
            <TextField label="Title" variant="outlined" fullWidth value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
            <TextField label="Description" variant="outlined" fullWidth multiline rows={3} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
            <TextField type="file" InputLabelProps={{ shrink: true }} label="Media file" fullWidth onChange={(e) => setFormData({...formData, mediaFile: e.target.files[0]})} />
            <TextField type="date" inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }} InputLabelProps={{ shrink: true }} label="Date" fullWidth value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }} disabled={isSubmitting}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={isSubmitting} sx={{ bgcolor: '#9c27b0', color: 'white', '&:hover': { bgcolor: '#7b1fa2' }, '&.Mui-disabled': { bgcolor: '#e1bee7', color: 'rgba(255, 255, 255, 0.7)' }, textTransform: 'none', fontWeight: 600, px: 3, borderRadius: 2 }}>
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (editId ? 'Save Changes' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        {selectedEvent && (
          <>
            <DialogTitle sx={{ fontWeight: 700, pb: 1, bgcolor: selectedEvent.color, color: 'white' }}>{selectedEvent.title}</DialogTitle>
            <DialogContent sx={{ mt: 2, pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                Date: {format(new Date(selectedEvent.date), 'MMMM d, yyyy')}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedEvent.description || "No description provided."}
              </Typography>
              {selectedEvent.mediaUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <img src={selectedEvent.mediaUrl.startsWith('http') ? selectedEvent.mediaUrl : `${import.meta.env.VITE_API_URL}/${selectedEvent.mediaUrl}`} alt="Schedule Media" style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 300, objectFit: 'contain' }} />
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 2 }}>
              <Button onClick={() => setSelectedEvent(null)} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
