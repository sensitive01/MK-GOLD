import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Card,
  Table,
  Stack,
  Button,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
  TablePagination,
  Box,
  Snackbar,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  Switch,
  FormControlLabel,
  RadioGroup,
  Radio,
  Tooltip,
  Paper,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import moment from 'moment';

// Components & Icons
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import { UserListHead } from '../../sections/@dashboard/user';
import {
  getNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotificationById,
} from '../../apis/admin/notificationManagement';
import { getUser } from '../../apis/admin/user';
import global from '../../utils/global';

const TABLE_HEAD = [
  { id: 'notificationType', label: 'Type', alignRight: false },
  { id: 'content', label: 'Title / Message', alignRight: false },
  { id: 'targetRoles', label: 'Target Audience', alignRight: false },
  { id: 'image', label: 'Image', alignRight: false },
  { id: 'options', label: 'Options', alignRight: false },
  { id: 'expiryDate', label: 'Expiry Date', alignRight: false },
  { id: 'isActive', label: 'Status', alignRight: false },
  { id: 'actions', label: 'Actions', alignRight: true },
];

const ROLE_OPTIONS = [
  { label: 'All Roles', value: 'all' },
  { label: 'Branch Staff', value: 'branch' },
  { label: 'Store Manager', value: 'store' },
  { label: 'Melting Login', value: 'melting' },
  { label: 'Finance', value: 'finance' },
  { label: 'Auditor', value: 'auditor' },
  { label: 'Asst Branch Manager', value: 'assistant_branch_manager' },
  { label: 'Branch Executive', value: 'branch_executive' },
  { label: 'Transaction Executive', value: 'transaction_executive' },
  { label: 'HR', value: 'hr' },
  { label: 'Marketing', value: 'marketing' },
  { label: 'Tele-Calling', value: 'telecalling' },
  { label: 'Bullion Desk', value: 'bullion_desk' },
];

const THEME_COLORS = [
  { label: 'MK Purple', value: 'primary', bg: '#5b21b6', text: '#ffffff' },
  { label: 'Gold Notice', value: 'gold', bg: '#d97706', text: '#ffffff' },
  { label: 'Alert Red', value: 'error', bg: '#dc2626', text: '#ffffff' },
  { label: 'Warning Orange', value: 'warning', bg: '#ea580c', text: '#ffffff' },
  { label: 'Info Blue', value: 'info', bg: '#0284c7', text: '#ffffff' },
  { label: 'Deep Slate', value: 'dark', bg: '#1e293b', text: '#ffffff' },
];

const SPEED_MAP = {
  slow: '3',
  normal: '5',
  fast: '8',
};

export default function NotificationManagement() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tabFilter, setTabFilter] = useState('all');
  const [users, setUsers] = useState([]);

  // Create / Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState('scroll'); // 'scroll' | 'popup'
  const [formContent, setFormContent] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSpeed, setFormSpeed] = useState('normal');
  const [formColor, setFormColor] = useState('primary');
  const [formRoles, setFormRoles] = useState(['all']);
  const [formTargetUser, setFormTargetUser] = useState('');
  const [formActionText, setFormActionText] = useState('Got it');
  const [formActionUrl, setFormActionUrl] = useState('');
  const [formExpiryDate, setFormExpiryDate] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Live Modal Preview Dialog State
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState(null);

  // Notification Toast
  const [notify, setNotify] = useState({ open: false, message: '', type: 'success' });

  // Fetch Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getNotifications();
      if (res.status && Array.isArray(res.data)) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    getUser({ status: 'active' }).then((res) => {
      if (res.status && Array.isArray(res.data)) {
        setUsers(res.data);
      }
    });
  }, []);

  const handleOpenCreate = () => {
    setEditId(null);
    setFormType('scroll');
    setFormContent('');
    setFormTitle('');
    setFormDescription('');
    setFormSpeed('normal');
    setFormColor('primary');
    setFormRoles(['all']);
    setFormTargetUser('');
    setFormActionText('Got it');
    setFormActionUrl('');
    setFormExpiryDate('');
    setFormIsActive(true);
    setFile(null);
    setPreviewImage(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = async (item) => {
    setEditId(item._id);
    setFormType(item.notificationType || 'scroll');
    setFormContent(item.content || '');
    setFormTitle(item.title || '');
    setFormDescription(item.description || '');
    setFormSpeed(item.scrollSpeed || 'normal');
    setFormColor(item.themeColor || 'primary');
    setFormRoles(Array.isArray(item.targetRoles) && item.targetRoles.length ? item.targetRoles : ['all']);
    setFormTargetUser(item.targetUser?._id || item.targetUser || '');
    setFormActionText(item.actionText || 'Got it');
    setFormActionUrl(item.actionUrl || '');
    setFormExpiryDate(item.expiryDate ? moment(item.expiryDate).format('YYYY-MM-DD') : '');
    setFormIsActive(item.isActive !== false);
    setFile(null);

    const existingImg = item.file?.uploadedFile || item.image;
    if (existingImg && existingImg !== 'undefined') {
      setPreviewImage(existingImg.startsWith('http') ? existingImg : `${global.baseURL}/${existingImg}`);
    } else {
      setPreviewImage(null);
    }
    setDialogOpen(true);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setPreviewImage(URL.createObjectURL(selected));
    }
  };

  const handleRemoveImage = () => {
    setFile(null);
    setPreviewImage(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (formType === 'scroll' && !formContent.trim()) {
      setNotify({ open: true, message: 'Please enter the marquee scroll message.', type: 'warning' });
      return;
    }
    if (formType === 'popup' && !formTitle.trim()) {
      setNotify({ open: true, message: 'Please enter the pop-up title.', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('notificationType', formType);
      formData.append('content', formContent);
      formData.append('title', formTitle);
      formData.append('description', formDescription);
      formData.append('scrollSpeed', formSpeed);
      formData.append('themeColor', formColor);
      formData.append('targetRoles', JSON.stringify(formRoles));
      formData.append('targetUser', formTargetUser || '');
      formData.append('actionText', formActionText || 'Got it');
      formData.append('actionUrl', formActionUrl || '');
      formData.append('expiryDate', formExpiryDate || '');
      formData.append('isActive', formIsActive);

      if (file) {
        formData.append('uploadedFile', file);
      }

      let res;
      if (editId) {
        res = await updateNotification(editId, formData);
      } else {
        res = await createNotification(formData);
      }

      if (res && res.status) {
        setNotify({
          open: true,
          message: editId ? 'Notification updated successfully!' : 'Notification created successfully!',
          type: 'success',
        });
        setDialogOpen(false);
        fetchData();
      } else {
        setNotify({ open: true, message: res?.message || 'Failed to save notification', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notification?')) return;
    try {
      const res = await deleteNotificationById(id);
      if (res && res.status) {
        setNotify({ open: true, message: 'Notification deleted successfully!', type: 'success' });
        fetchData();
      } else {
        setNotify({ open: true, message: res?.message || 'Failed to delete notification', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message, type: 'error' });
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      const newStatus = !item.isActive;
      const formData = new FormData();
      formData.append('isActive', newStatus);
      const res = await updateNotification(item._id, formData);
      if (res && res.status) {
        setData((prev) => prev.map((n) => (n._id === item._id ? { ...n, isActive: newStatus } : n)));
        setNotify({
          open: true,
          message: `Notification marked as ${newStatus ? 'Active' : 'Inactive'}`,
          type: 'info',
        });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message, type: 'error' });
    }
  };

  // Preview Action
  const handleOpenPreview = (item) => {
    setPreviewItem(item);
    setPreviewModalOpen(true);
  };

  // Filter Data
  const filteredData = data.filter((item) => {
    if (tabFilter === 'scroll') return item.notificationType === 'scroll';
    if (tabFilter === 'popup') return item.notificationType === 'popup';
    return true;
  });

  const currentColorConfig = THEME_COLORS.find((c) => c.value === formColor) || THEME_COLORS[0];

  return (
    <>
      <Helmet>
        <title>Notification Management | MK Gold Admin</title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>
              Notification Management
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
              Broadcast scrolling marquee notices and interactive pop-up alerts to staff and branches
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={handleOpenCreate}
            sx={{
              bgcolor: '#FFD700',
              color: '#000',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 1.2,
              boxShadow: '0 4px 12px rgba(255,215,0,0.35)',
              '&:hover': { bgcolor: '#e6c200', color: '#000' },
            }}
          >
            New Notification
          </Button>
        </Stack>

        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          {/* Tabs Filter */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, pt: 1 }}>
            <Tabs
              value={tabFilter}
              onChange={(e, val) => setTabFilter(val)}
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab label={`All (${data.length})`} value="all" sx={{ fontWeight: 600 }} />
              <Tab
                label={`Scroll Marquee (${data.filter((d) => d.notificationType === 'scroll').length})`}
                value="scroll"
                sx={{ fontWeight: 600 }}
              />
              <Tab
                label={`Pop-up Modal (${data.filter((d) => d.notificationType === 'popup').length})`}
                value="popup"
                sx={{ fontWeight: 600 }}
              />
            </Tabs>
          </Box>

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <UserListHead
                  headLabel={TABLE_HEAD}
                  rowCount={filteredData.length}
                  numSelected={0}
                  onSelectAllClick={() => {}}
                  hideCheckbox
                />
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const isScroll = row.notificationType === 'scroll';
                      const img = row.file?.uploadedFile || row.image;
                      const imgSrc = img && img !== 'undefined' ? (img.startsWith('http') ? img : `${global.baseURL}/${img}`) : null;

                      return (
                        <TableRow hover key={row._id}>
                          <TableCell>
                            <Chip
                              icon={
                                <Iconify
                                  icon={isScroll ? 'solar:ticker-star-bold' : 'solar:window-frame-bold'}
                                  sx={{ width: 18, height: 18 }}
                                />
                              }
                              label={isScroll ? 'Marquee' : 'Pop-up'}
                              size="small"
                              sx={{
                  
                                bgcolor: isScroll ? '#eff6ff' : '#faf5ff',
                                color: isScroll ? '#1d4ed8' : '#7e22ce',
                                border: '1px solid',
                                borderColor: isScroll ? '#bfdbfe' : '#e9d5ff',
                              }}
                            />
                          </TableCell>

                          <TableCell sx={{ maxWidth: 320 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                              {isScroll ? row.content || 'Untitled' : row.title || 'Untitled'}
                            </Typography>
                            {!isScroll && row.description && (
                              <Typography
                                variant="caption"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  color: 'text.secondary',
                                }}
                              >
                                {row.description}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {row.targetRoles && row.targetRoles.includes('all') ? (
                                <Chip label="All Roles" size="small" color="primary" variant="outlined" />
                              ) : (
                                (row.targetRoles || []).map((r, i) => (
                                  <Chip
                                    key={i}
                                    label={ROLE_OPTIONS.find((opt) => opt.value === r)?.label || r}
                                    size="small"
                                  color="success"
                                    sx={{ textTransform: 'capitalize', bgcolor: '#f1f5f9' }}
                                  />
                                ))
                              )}
                            </Box>
                          </TableCell>

                          <TableCell>
                            {imgSrc ? (
                              <Box
                                component="img"
                                src={imgSrc}
                                alt="thumb"
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 1,
                                  objectFit: 'cover',
                                  cursor: 'pointer',
                                  border: '1px solid #e2e8f0',
                                }}
                                onClick={() => handleOpenPreview(row)}
                              />
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                                None
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            {isScroll ? (
                              <Stack spacing={0.5}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Speed: <b>{row.scrollSpeed || 'normal'}</b>
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  Theme: <b>{row.themeColor || 'primary'}</b>
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                Action: <b>{row.actionText || 'Got it'}</b>
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell>
                            {row.expiryDate ? (
                              <Typography variant="body2" sx={{ color: '#475569' }}>
                                {moment(row.expiryDate).format('YYYY-MM-DD')}
                              </Typography>
                            ) : (
                              <Chip label="No Expiry" size="small" variant="outlined" />
                            )}
                          </TableCell>

                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  color="success"
                                  checked={Boolean(row.isActive)}
                                  onChange={() => handleToggleStatus(row)}
                                />
                              }
                              label={row.isActive ? 'Active' : 'Inactive'}
                              sx={{ '& .MuiTypography-root': { fontSize: '0.8125rem' } }}
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Tooltip title="Preview Notification">
                              <IconButton size="small" color="primary" onClick={() => handleOpenPreview(row)}>
                                <Iconify icon="eva:eye-fill" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton size="small" color="secondary" onClick={() => handleOpenEdit(row)}>
                                <Iconify icon="eva:edit-fill" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(row._id)}>
                                <Iconify icon="eva:trash-2-outline" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {filteredData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
                          No notifications found
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={handleOpenCreate}
                        >
                          Create your first notification
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, p) => setPage(p)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      </Container>

      {/* CREATE / EDIT DIALOG */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <form onSubmit={handleSave}>
          <DialogTitle
            sx={{
              p: 2.5,
              bgcolor: '#FFD700',


              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editId ? 'Edit Notification' : 'Create New Notification'}
            </Typography>
            <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setDialogOpen(false)}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ p: 3 }}>
            <Stack spacing={3}>
              {/* Type Switcher */}
              <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: '#334155' }}>
                  Select Notification Type:
                </Typography>
                <RadioGroup
                  row
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  sx={{ gap: 4 }}
                >
                  <FormControlLabel
                    value="scroll"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify icon="solar:ticker-star-bold" sx={{ color: '#1d4ed8' }} />
                        <Typography sx={{ fontWeight: 600 }}>Scroll (Marquee Tag)</Typography>
                      </Box>
                    }
                  />
                  <FormControlLabel
                    value="popup"
                    control={<Radio color="primary" />}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Iconify icon="solar:window-frame-bold" sx={{ color: '#7e22ce' }} />
                        <Typography sx={{ fontWeight: 600 }}>Pop-up (Modal Dialog)</Typography>
                      </Box>
                    }
                  />
                </RadioGroup>
              </Box>

              {/* CONDITIONAL FORM FOR SCROLL */}
              {formType === 'scroll' && (
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Marquee Message / Scrolling Content *"
                    multiline
                    rows={2}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="e.g. 📢 Notice: Gold rate has been updated at 2:00 PM today. Please verify packets before transit dispatch."
                    helperText="This text will scroll smoothly across the top of dashboards."
                  />

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <FormControl fullWidth>
                      <InputLabel>Scroll Speed</InputLabel>
                      <Select
                        label="Scroll Speed"
                        value={formSpeed}
                        onChange={(e) => setFormSpeed(e.target.value)}
                      >
                        <MenuItem value="slow">Slow (Reading-friendly)</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="fast">Fast</MenuItem>
                      </Select>
                    </FormControl>

                    <FormControl fullWidth>
                      <InputLabel>Theme Color</InputLabel>
                      <Select
                        label="Theme Color"
                        value={formColor}
                        onChange={(e) => setFormColor(e.target.value)}
                      >
                        {THEME_COLORS.map((tc) => (
                          <MenuItem key={tc.value} value={tc.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: tc.bg }} />
                              {tc.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Stack>

                  {/* Live Scrolling Marquee Preview */}
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', mb: 0.5, display: 'block' }}>
                      LIVE MARQUEE PREVIEW (Hover mouse over ticker to pause):
                    </Typography>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 1.2,
                        borderRadius: 1.5,
                        bgcolor: currentColorConfig.bg,
                        color: currentColorConfig.text,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Box
                        component="marquee"
                        behavior="scroll"
                        direction="left"
                        scrollamount={SPEED_MAP[formSpeed] || '5'}
                        onMouseEnter={(e) => e.target.stop()}
                        onMouseLeave={(e) => e.target.start()}
                        sx={{
                          width: '100%',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {formContent.trim() || 'Enter text above to see live scrolling marquee in action...'}
                      </Box>
                    </Paper>
                  </Box>
                </Stack>
              )}

              {/* CONDITIONAL FORM FOR POPUP */}
              {formType === 'popup' && (
                <Stack spacing={2.5}>
                  <TextField
                    fullWidth
                    label="Pop-up Title *"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Important Announcement: Diwali Bonus & Schedule"
                  />

                  <TextField
                    fullWidth
                    label="Description / Body Content"
                    multiline
                    rows={4}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Enter detailed message, instructions, or points..."
                  />

                  {/* Image Upload with Preview */}
                  <Box sx={{ p: 2, border: '1px dashed #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                      Pop-up Image / Flyer / Poster:
                    </Typography>
                    {previewImage ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          component="img"
                          src={previewImage}
                          alt="preview"
                          sx={{ maxHeight: 120, maxWidth: 200, borderRadius: 1.5, objectFit: 'contain' }}
                        />
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Iconify icon="eva:trash-2-outline" />}
                          onClick={handleRemoveImage}
                        >
                          Remove Image
                        </Button>
                      </Box>
                    ) : (
                      <Button variant="outlined" component="label" startIcon={<Iconify icon="eva:upload-fill" />}>
                        Choose Image
                        <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                      </Button>
                    )}
                  </Box>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      fullWidth
                      label="Action Button Label"
                      value={formActionText}
                      onChange={(e) => setFormActionText(e.target.value)}
                      placeholder="e.g. Got it / Acknowledge / View Offer"
                    />
                    <TextField
                      fullWidth
                      label="Action Link / URL (Optional)"
                      value={formActionUrl}
                      onChange={(e) => setFormActionUrl(e.target.value)}
                      placeholder="e.g. /branch/transit or https://..."
                    />
                  </Stack>
                </Stack>
              )}

              <Divider />

              {/* Common Target & Timing Fields */}
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                Audience & Schedule Options:
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Target Roles</InputLabel>
                  <Select
                    multiple
                    label="Target Roles"
                    value={formRoles}
                    onChange={(e) => setFormRoles(e.target.value)}
                    renderValue={(selected) => (selected.includes('all') ? 'All Roles' : selected.map((val) => ROLE_OPTIONS.find((r) => r.value === val)?.label || val).join(', '))}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Checkbox checked={formRoles.indexOf(role.value) > -1} />
                        <ListItemText primary={role.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel>Specific User (Optional)</InputLabel>
                  <Select
                    label="Specific User (Optional)"
                    value={formTargetUser}
                    onChange={(e) => setFormTargetUser(e.target.value)}
                  >
                    <MenuItem value="">None (Broadcast to selected roles)</MenuItem>
                    {users.map((u) => (
                      <MenuItem key={u._id} value={u._id}>
                        {u.username} ({u.userType})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  fullWidth
                  type="date"
                  label="Expiry Date"
                  InputLabelProps={{ shrink: true }}
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  helperText="Leave empty to keep notification active indefinitely"
                />

                <Box sx={{ width: '100%', pl: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formIsActive}
                        onChange={(e) => setFormIsActive(e.target.checked)}
                        color="success"
                      />
                    }
                    label={
                      <Typography sx={{ fontWeight: 600 }}>
                        Active Status ({formIsActive ? 'Active' : 'Inactive'})
                      </Typography>
                    }
                  />
                </Box>
              </Stack>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setDialogOpen(false)} color="inherit">
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={submitting}
              sx={{
                bgcolor: '#FFD700',
                color: '#000',
                fontWeight: 700,
                px: 3.5,
                py: 1,
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.35)',
                '&:hover': {
                  bgcolor: '#e6c200',
                  color: '#000',
                },
              }}
            >
              {editId ? 'Update Notification' : 'Create Notification'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* INTERACTIVE PREVIEW MODAL */}
      <Dialog
        open={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5, overflow: 'hidden' } }}
      >
        {previewItem && (
          <>
            <DialogTitle
              sx={{
                p: 2,
                bgcolor: '#5b21b6',


                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {previewItem.notificationType === 'scroll' ? 'Marquee Preview' : previewItem.title || 'Notification'}
              </Typography>
              <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setPreviewModalOpen(false)}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {previewItem.notificationType === 'scroll' ? (
                <Stack spacing={2}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    This marquee appears across the top of dashboards for targeted roles:
                  </Typography>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor:
                        (THEME_COLORS.find((c) => c.value === previewItem.themeColor) || THEME_COLORS[0]).bg,
                      color: '#fff',
                      borderRadius: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      component="marquee"
                      behavior="scroll"
                      direction="left"
                      scrollamount={SPEED_MAP[previewItem.scrollSpeed] || '5'}
                      onMouseEnter={(e) => e.target.stop()}
                      onMouseLeave={(e) => e.target.start()}
                      sx={{ fontSize: '1rem', fontWeight: 600, width: '100%' }}
                    >
                      {previewItem.content}
                    </Box>
                  </Paper>
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {(previewItem.file?.uploadedFile || previewItem.image) && (
                    <Box sx={{ textAlign: 'center', mb: 1 }}>
                      <Box
                        component="img"
                        src={
                          (previewItem.file?.uploadedFile || previewItem.image).startsWith('http')
                            ? previewItem.file?.uploadedFile || previewItem.image
                            : `${global.baseURL}/${previewItem.file?.uploadedFile || previewItem.image}`
                        }
                        alt="preview"
                        sx={{
                          maxWidth: '100%',
                          maxHeight: 280,
                          borderRadius: 2,
                          objectFit: 'contain',
                        }}
                      />
                    </Box>
                  )}
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: '#1e293b' }}>
                    {previewItem.description || 'No description provided.'}
                  </Typography>
                </Stack>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
              <Button onClick={() => setPreviewModalOpen(false)} color="inherit">
                Close Preview
              </Button>
              {previewItem.notificationType === 'popup' && (
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: '#FFD700',
                    color: '#000',
                    fontWeight: 700,
                    boxShadow: '0 2px 8px rgba(255, 215, 0, 0.35)',
                    '&:hover': { bgcolor: '#e6c200', color: '#000' },
                  }}
                  onClick={() => setPreviewModalOpen(false)}
                >
                  {previewItem.actionText || 'Got it'}
                </Button>
              )}
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* SNACKBAR NOTIFICATION */}
      <Snackbar
        open={notify.open}
        autoHideDuration={4000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={notify.type}
          onClose={() => setNotify({ ...notify, open: false })}
          sx={{ width: '100%' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>
    </>
  );
}

