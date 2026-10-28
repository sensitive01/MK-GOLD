import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Box,
  Typography,
  Chip,
  Stack,
  IconButton,
  Divider,
  Paper,
  Avatar,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import FlagIcon from '@mui/icons-material/Flag';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HistoryIcon from '@mui/icons-material/History';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import moment from 'moment';

import { updateTaskStatus } from '../../../apis/admin/task';

const PRIORITIES = {
  low: { label: 'Low', color: 'success' },
  medium: { label: 'Medium', color: 'info' },
  high: { label: 'High', color: 'warning' },
  urgent: { label: 'Urgent', color: 'error' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning' },
  accepted: { label: 'Accepted', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  cancelled: { label: 'Cancelled', color: 'error' },
};

const EMPLOYEE_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'accepted', label: 'Accepted', color: 'info' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const ADMIN_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

const STATUS_OPTIONS = EMPLOYEE_STATUS_OPTIONS;

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function TaskDetailDialog({ open, onClose, task, onStatusUpdated, isEmployee = false }) {
  const [newStatus, setNewStatus] = useState(task?.status || 'pending');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updating, setUpdating] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);

  React.useEffect(() => {
    if (task) {
      setNewStatus(task.status || 'pending');
      setStatusRemarks('');
    }
  }, [task]);

  if (!task) return null;

  const priorityMeta = PRIORITIES[task.priority] || PRIORITIES.medium;
  const statusMeta = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const availableStatusOptions = isEmployee ? EMPLOYEE_STATUS_OPTIONS : ADMIN_STATUS_OPTIONS;

  const isOverdue =
    task.deadline &&
    new Date(task.deadline) < new Date() &&
    task.status !== 'completed' &&
    task.status !== 'cancelled';

  const handleQuickAccept = async () => {
    setUpdating(true);
    try {
      const res = await updateTaskStatus(task._id, {
        status: 'accepted',
        remarks: 'Task accepted by employee',
      });
      if (res.status) {
        setStatusRemarks('');
        if (onStatusUpdated) {
          onStatusUpdated(res.data);
        }
      } else {
        alert(res.message || 'Failed to accept task');
      }
    } catch (err) {
      alert(err.message || 'Error accepting task');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    try {
      const res = await updateTaskStatus(task._id, {
        status: newStatus,
        remarks: statusRemarks.trim(),
      });
      if (res.status) {
        setStatusRemarks('');
        if (onStatusUpdated) {
          onStatusUpdated(res.data);
        }
      } else {
        alert(res.message || 'Failed to update status');
      }
    } catch (err) {
      alert(err.message || 'Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
        <DialogTitle component="div" sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ pr: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Chip size="small" label={task.taskType || 'General'} color="primary" variant="outlined" />
              <Chip size="small" label={priorityMeta.label} color={priorityMeta.color} icon={<FlagIcon />} />
              <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
              {isOverdue && (
                <Chip size="small" label="OVERDUE" color="error" sx={{ fontWeight: 'bold' }} />
              )}
              {isEmployee && task.status === 'pending' && (
                <Button
                  size="small"
                  variant="contained"
                  color="info"
                  startIcon={<ThumbUpAltIcon />}
                  onClick={handleQuickAccept}
                  disabled={updating}
                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                >
                  {updating ? 'Accepting...' : 'Accept Task'}
                </Button>
              )}
            </Stack>
            <Typography component="div" variant="h5" fontWeight="bold">
              {task.title}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Meta Information Row */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Created By
                    </Typography>
                    <Typography variant="subtitle2">
                      {task.createdBy?.username ? `${task.createdBy.username} (${task.createdBy.userType || 'Admin'})` : 'Admin'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {moment(task.createdAt).format('DD MMM YYYY, hh:mm A')}
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Deadline
                    </Typography>
                    <Typography
                      variant="subtitle2"
                      color={isOverdue ? 'error.main' : 'text.primary'}
                      fontWeight={isOverdue ? 'bold' : 'normal'}
                    >
                      {task.deadline
                        ? moment(task.deadline).format('DD MMM YYYY, hh:mm A')
                        : 'No deadline set'}
                    </Typography>
                    {task.deadline && (
                      <Typography variant="caption" color={isOverdue ? 'error.main' : 'text.secondary'}>
                        {moment(task.deadline).fromNow()}
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      Current Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Assigned Employees */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Assigned Employees ({task.assignedEmployees?.length || 0}):
              </Typography>

              {task.assignedEmployees?.length > 0 ? (
                <Grid container spacing={1.5}>
                  {task.assignedEmployees.map((emp) => (
                    <Grid item xs={12} sm={6} key={emp._id || emp}>
                      <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" noWrap>
                            {emp.name || 'Employee'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            ID: {emp.employeeId || 'N/A'} • {emp.designation || 'Staff'}
                          </Typography>
                          {emp.phoneNumber && (
                            <Typography variant="caption" color="text.secondary">
                              📞 {emp.phoneNumber}
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No individual employees assigned specifically (Assigned by Role/Designation).
                </Typography>
              )}
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                Description:
              </Typography>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.paper', whiteSpace: 'pre-wrap' }}>
                <Typography variant="body2">{task.description || 'No description provided.'}</Typography>
              </Paper>
            </Grid>

            {/* Remarks */}
            {task.remarks && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Remarks:
                </Typography>
                <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'background.neutral' }}>
                  <Typography variant="body2">{task.remarks}</Typography>
                </Paper>
              </Grid>
            )}

            {/* Attachments Section */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Attachments ({task.attachments?.length || 0}):
              </Typography>
              {task.attachments?.length > 0 ? (
                <Grid container spacing={1.5}>
                  {task.attachments.map((att, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={att._id || idx}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          flexDirection: 'column',
                          height: '100%',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          {att.fileType === 'image' ? (
                            <ImageIcon color="primary" />
                          ) : att.fileType === 'video' ? (
                            <VideoLibraryIcon color="secondary" />
                          ) : (
                            <InsertDriveFileIcon color="action" />
                          )}
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" noWrap fontWeight="bold" title={att.name}>
                              {att.name || 'Attachment'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {att.fileType?.toUpperCase()} {att.size ? `• ${formatBytes(att.size)}` : ''}
                            </Typography>
                          </Box>
                        </Stack>

                        {/* Thumbnail preview for images */}
                        {att.fileType === 'image' && att.url && (
                          <Box
                            component="img"
                            src={att.url}
                            alt={att.name}
                            sx={{
                              width: '100%',
                              height: 100,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mb: 1,
                              cursor: 'pointer',
                            }}
                            onClick={() => setPreviewMedia({ type: 'image', url: att.url, name: att.name })}
                          />
                        )}

                        {/* Video player for videos */}
                        {att.fileType === 'video' && att.url && (
                          <Box
                            component="video"
                            src={att.url}
                            controls
                            sx={{
                              width: '100%',
                              height: 120,
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: 'black',
                            }}
                          />
                        )}

                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<OpenInNewIcon fontSize="small" />}
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Open
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<DownloadIcon fontSize="small" />}
                            href={att.url}
                            download={att.name || 'download'}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Download
                          </Button>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No attachments uploaded.
                </Typography>
              )}
            </Grid>

            {/* Quick Status Update Section */}
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip label="Update Task Status" size="small" />
              </Divider>

              {isEmployee && task.status === 'pending' && (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 1.5,
                    mb: 2,
                    bgcolor: 'info.lighter',
                    borderColor: 'info.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle2" color="info.darker" fontWeight="bold">
                      Task Pending Acceptance
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Please accept this task so the management knows you have acknowledged it.
                    </Typography>
                  </Box>
                  <Button
                    variant="contained"
                    color="info"
                    size="small"
                    startIcon={<ThumbUpAltIcon />}
                    onClick={handleQuickAccept}
                    disabled={updating}
                    sx={{ fontWeight: 'bold' }}
                  >
                    {updating ? 'Accepting...' : 'Accept Task'}
                  </Button>
                </Paper>
              )}

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Update Status</InputLabel>
                      <Select
                        value={newStatus}
                        label="Update Status"
                        onChange={(e) => setNewStatus(e.target.value)}
                        renderValue={(selected) => {
                          const s = STATUS_CONFIG[selected] || { label: selected, color: 'default' };
                          return <Chip size="small" label={s.label} color={s.color} />;
                        }}
                      >
                        {availableStatusOptions.map((s) => (
                          <MenuItem key={s.value} value={s.value}>
                            <Chip size="small" label={s.label} color={s.color} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      size="small"
                      fullWidth
                      label="Status Remarks"
                      placeholder="e.g. Audit completed, report attached..."
                      value={statusRemarks}
                      onChange={(e) => setStatusRemarks(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleUpdateStatus}
                      disabled={updating || (newStatus === task.status && !statusRemarks.trim())}
                      startIcon={updating ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
                    >
                      {updating ? 'Updating...' : 'Save Status'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* History / Audit Log */}
            {task.history?.length > 0 && (
              <Grid item xs={12}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <HistoryIcon fontSize="small" color="action" />
                  <Typography variant="subtitle2" color="text.secondary">
                    Status History & Activity ({task.history.length}):
                  </Typography>
                </Stack>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Stack spacing={1.5} divider={<Divider />}>
                    {task.history
                      .slice()
                      .reverse()
                      .map((hist, idx) => (
                        <Box key={hist._id || idx}>
                          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip
                                size="small"
                                label={hist.status?.toUpperCase() || 'UPDATED'}
                                color={STATUS_CONFIG[hist.status]?.color || 'default'}
                              />
                              <Typography variant="subtitle2">
                                {hist.updatedBy?.username || 'System / Admin'}
                              </Typography>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              {moment(hist.updatedAt).format('DD MMM YYYY, hh:mm A')}
                            </Typography>
                          </Stack>
                          {hist.remarks && (
                            <Typography variant="body2" sx={{ mt: 0.5, pl: 0.5 }} color="text.secondary">
                              {hist.remarks}
                            </Typography>
                          )}
                        </Box>
                      ))}
                  </Stack>
                </Paper>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Media Preview Modal */}
      {previewMedia && (
        <Dialog open={Boolean(previewMedia)} onClose={() => setPreviewMedia(null)} maxWidth="lg">
          <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1">{previewMedia.name || 'Preview'}</Typography>
            <IconButton onClick={() => setPreviewMedia(null)} size="small">
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, textAlign: 'center' }}>
            {previewMedia.type === 'image' && (
              <Box
                component="img"
                src={previewMedia.url}
                alt={previewMedia.name}
                sx={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: 1 }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

TaskDetailDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  task: PropTypes.object,
  onStatusUpdated: PropTypes.func,
};
