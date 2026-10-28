import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Box,
  Chip,
  Checkbox,
  ListItemText,
  Typography,
  Stack,
  IconButton,
  Tooltip,
  Paper,
  Avatar,
  Autocomplete,
  createFilterOptions,
  Divider,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import moment from 'moment';

import { getEmployee } from '../../../apis/admin/employee';
import { createTask, updateTask } from '../../../apis/admin/task';

const TASK_TYPES = [
  'General',
  'Daily Operation',
  'Audit & Inspection',
  'Gold Verification',
  'Transit Follow-up',
  'Lead Follow-up',
  'Cash Reconciliation',
  'Store Inventory',
  'Customer Support',
  'Melting & Purity Check',
  'Urgent Action',
];

const filter = createFilterOptions();

const PRIORITIES = [
  { value: 'low', label: 'Low', color: 'success' },
  { value: 'medium', label: 'Medium', color: 'info' },
  { value: 'high', label: 'High', color: 'warning' },
  { value: 'urgent', label: 'Urgent', color: 'error' },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'warning' },
  { value: 'completed', label: 'Completed', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default function TaskFormDialog({ open, onClose, taskData, onSuccess }) {
  const isEdit = Boolean(taskData && taskData._id);

  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [taskTypeOptions, setTaskTypeOptions] = useState(TASK_TYPES);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [taskType, setTaskType] = useState('General');
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('pending');
  const [remarks, setRemarks] = useState('');

  // Files State
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    // Load active employees
    getEmployee({ status: 'active' })
      .then((res) => {
        if (res?.status && Array.isArray(res?.data)) {
          setEmployees(res.data);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (taskData && open) {
      const currentType = taskData.taskType || 'General';
      setTaskType(currentType);
      if (currentType && !taskTypeOptions.includes(currentType)) {
        setTaskTypeOptions((prev) => [...prev, currentType]);
      }
      setAssignedEmployees(
        Array.isArray(taskData.assignedEmployees)
          ? taskData.assignedEmployees.map((emp) => (typeof emp === 'object' ? emp._id : emp))
          : []
      );
      setPriority(taskData.priority || 'medium');
      setDeadline(taskData.deadline ? moment(taskData.deadline).format('YYYY-MM-DDTHH:mm') : '');
      setStatus(taskData.status || 'pending');
      setRemarks(taskData.remarks || '');
      setExistingAttachments(taskData.attachments || []);
      setNewFiles([]);
      setFormErrors({});
    } else if (open) {
      // Reset form for create
      setTitle('');
      setDescription('');
      setTaskType('General');
      setAssignedEmployees([]);
      setPriority('medium');
      setDeadline('');
      setStatus('pending');
      setRemarks('');
      setExistingAttachments([]);
      setNewFiles([]);
      setFormErrors({});
    }
  }, [taskData, open]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setNewFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleRemoveNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingAttachment = (index) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const errors = {};
    if (!title.trim()) {
      errors.title = 'Task title is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('taskType', taskType?.trim() || 'General');
      formData.append('priority', priority);
      formData.append('status', status);
      if (deadline) {
        formData.append('deadline', new Date(deadline).toISOString());
      } else {
        formData.append('deadline', '');
      }
      formData.append('remarks', remarks.trim());

      // Target assignments - assign employees
      assignedEmployees.forEach((empId) => formData.append('assignedEmployees', empId));

      // Existing attachments
      if (isEdit) {
        formData.append('existingAttachments', JSON.stringify(existingAttachments));
      }

      // New files
      newFiles.forEach((file) => {
        formData.append('attachments', file);
      });

      let res;
      if (isEdit) {
        res = await updateTask(taskData._id, formData);
      } else {
        res = await createTask(formData);
      }

      if (res.status) {
        onSuccess(isEdit ? 'Task updated successfully!' : 'Task created successfully!');
        onClose();
      } else {
        alert(res.message || 'Error saving task');
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error submitting task');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    const type = file.type || '';
    const name = file.name || '';
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name)) {
      return <ImageIcon color="primary" />;
    }
    if (type.startsWith('video/') || /\.(mp4|mov|avi|webm)$/i.test(name)) {
      return <VideoLibraryIcon color="secondary" />;
    }
    return <InsertDriveFileIcon color="action" />;
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" scroll="paper">
      <DialogTitle component="div" sx={{ m: 0, p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography component="div" variant="h6" fontWeight="bold">
          {isEdit ? 'Edit Task' : 'Create New Task'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={2.5}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              label="Task Title *"
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={Boolean(formErrors.title)}
              helperText={formErrors.title}
              placeholder="e.g. Conduct physical audit of branch locker"
            />
          </Grid>

          {/* Task Type & Priority */}
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={taskTypeOptions}
              value={taskType}
              onChange={(_, newValue) => setTaskType(newValue || '')}
              onInputChange={(_, newInputValue) => setTaskType(newInputValue || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Task Type"
                  placeholder="e.g. Daily Operation, Audit, etc."
                  fullWidth
                />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={priority}
                label="Priority"
                onChange={(e) => setPriority(e.target.value)}
                renderValue={(selected) => {
                  const p = PRIORITIES.find((item) => item.value === selected);
                  return p ? <Chip size="small" label={p.label} color={p.color} /> : selected;
                }}
              >
                {PRIORITIES.map((p) => (
                  <MenuItem key={p.value} value={p.value}>
                    <Chip size="small" label={p.label} color={p.color} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Deadline & Status */}
          <Grid item xs={12} sm={6}>
            <TextField
              label="Deadline"
              type="datetime-local"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={status}
                label="Status"
                onChange={(e) => setStatus(e.target.value)}
                renderValue={(selected) => {
                  const s = STATUS_OPTIONS.find((item) => item.value === selected);
                  return s ? <Chip size="small" label={s.label} color={s.color} /> : selected;
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    <Chip size="small" label={s.label} color={s.color} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Assign Employees" size="small" />
            </Divider>
          </Grid>

          {/* Choose Emp ID / Employees (Multiple) */}
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={employees}
              getOptionLabel={(option) =>
                typeof option === 'string'
                  ? option
                  : `[${option.employeeId || 'ID'}] ${option.name} (${option.designation || 'Staff'})`
              }
              value={employees.filter((emp) => assignedEmployees.includes(emp._id))}
              onChange={(_, newValue) => {
                setAssignedEmployees(newValue.map((emp) => emp._id));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Choose Employee(s) (By ID / Name)"
                  placeholder="Select one or multiple employees..."
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option._id}
                    size="small"
                    label={`[${option.employeeId || 'ID'}] ${option.name || 'Staff'}`}
                    color="primary"
                    sx={{ fontWeight: 500 }}
                  />
                ))
              }
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 1 }}>
              <Chip label="Details & Attachments" size="small" />
            </Divider>
          </Grid>

          {/* Task Description */}
          <Grid item xs={12}>
            <TextField
              label="Task Description"
              fullWidth
              multiline
              minRows={2}
              maxRows={6}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions or expectations for this task..."
            />
          </Grid>

          {/* Remarks */}
          <Grid item xs={12}>
            <TextField
              label="Remarks / Notes"
              fullWidth
              multiline
              minRows={2}
              maxRows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Any additional remarks or notes..."
            />
          </Grid>

          {/* Attachments Section */}
          <Grid item xs={12}>
            <Box
              component="label"
              sx={{
                p: 3,
                border: '2px dashed',
                borderColor: 'primary.light',
                borderRadius: 2,
                bgcolor: 'background.neutral',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: 'action.hover',
                  borderColor: 'primary.main',
                },
              }}
            >
              <input
                type="file"
                multiple
                style={{ display: 'none' }}
                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                onChange={handleFileChange}
              />
              <Avatar
                sx={{
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  width: 52,
                  height: 52,
                  mb: 1.5,
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Typography variant="subtitle1" fontWeight="bold">
                Click to upload attachments
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Upload multiple documents, images, or videos (PDF, Word, Excel, JPG, PNG, MP4, etc.)
              </Typography>
            </Box>

            {/* Existing Attachments (if editing) */}
            {existingAttachments.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Existing Attachments ({existingAttachments.length}):
                </Typography>
                <Stack spacing={1}>
                  {existingAttachments.map((att, idx) => (
                    <Paper
                      key={att._id || idx}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                        <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 38, height: 38 }}>
                          {att.fileType === 'image' ? (
                            <ImageIcon fontSize="small" />
                          ) : att.fileType === 'video' ? (
                            <VideoLibraryIcon fontSize="small" />
                          ) : (
                            <InsertDriveFileIcon fontSize="small" />
                          )}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap fontWeight={600}>
                            {att.name || 'Attachment'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {att.fileType?.toUpperCase()} {att.size ? `• ${formatBytes(att.size)}` : ''}
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Remove attachment">
                        <IconButton size="small" color="error" onClick={() => handleRemoveExistingAttachment(idx)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Newly Selected Files */}
            {newFiles.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                  New Files to Upload ({newFiles.length}):
                </Typography>
                <Stack spacing={1}>
                  {newFiles.map((f, idx) => (
                    <Paper
                      key={idx}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: 'background.paper',
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ overflow: 'hidden' }}>
                        <Avatar sx={{ bgcolor: 'info.lighter', color: 'info.main', width: 38, height: 38 }}>
                          {getFileIcon(f)}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" noWrap fontWeight={600}>
                            {f.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatBytes(f.size)}
                          </Typography>
                        </Box>
                      </Stack>
                      <Tooltip title="Remove file">
                        <IconButton size="small" color="error" onClick={() => handleRemoveNewFile(idx)}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
        >
          {loading ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

TaskFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  taskData: PropTypes.object,
  onSuccess: PropTypes.func.isRequired,
};
