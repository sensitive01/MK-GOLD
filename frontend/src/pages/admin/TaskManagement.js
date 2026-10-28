import { Helmet } from 'react-helmet-async';
import { useState, useEffect, forwardRef } from 'react';
import {
  Card,
  Table,
  Stack,
  Paper,
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
  Grid,
  Chip,
  Avatar,
  AvatarGroup,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableHead,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FlagIcon from '@mui/icons-material/Flag';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import moment from 'moment';

import Scrollbar from '../../components/scrollbar';
import { getTasks, deleteTask } from '../../apis/admin/task';

import { TaskFormDialog, TaskDetailDialog } from '../../components/admin/task';

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

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

export default function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Dialogs
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editTaskData, setEditTaskData] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTaskData, setDetailTaskData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Notification
  const [notify, setNotify] = useState({ open: false, message: '', type: 'success' });

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await getTasks();
      if (res.status && Array.isArray(res.data)) {
        setTasks(res.data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleOpenCreate = () => {
    setEditTaskData(null);
    setFormDialogOpen(true);
  };

  const handleOpenEdit = (task) => {
    setEditTaskData(task);
    setFormDialogOpen(true);
  };

  const handleOpenDetail = (task) => {
    setDetailTaskData(task);
    setDetailDialogOpen(true);
  };

  const handleOpenDelete = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      const res = await deleteTask(taskToDelete._id);
      if (res.status) {
        setNotify({ open: true, message: 'Task deleted successfully', type: 'success' });
        fetchTasks();
      } else {
        setNotify({ open: true, message: res.message || 'Error deleting task', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message, type: 'error' });
    } finally {
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleFormSuccess = (msg) => {
    setNotify({ open: true, message: msg, type: 'success' });
    fetchTasks();
  };

  const handleDetailStatusUpdated = (updatedTask) => {
    setNotify({ open: true, message: 'Status updated successfully', type: 'success' });
    setDetailTaskData(updatedTask);
    fetchTasks();
  };

  // Stats calculation
  const now = new Date();
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  // Filtered Tasks
  const filteredTasks = tasks.filter((task) => {
    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchType = task.taskType?.toLowerCase().includes(q);
      const matchEmp = task.assignedEmployees?.some(
        (e) => e.name?.toLowerCase().includes(q) || e.employeeId?.toLowerCase().includes(q)
      );
      if (!matchTitle && !matchDesc && !matchType && !matchEmp) return false;
    }

    // Status Filter
    if (statusFilter === 'overdue') {
      const isPast = task.deadline && new Date(task.deadline) < now;
      if (!isPast || task.status === 'completed' || task.status === 'cancelled') return false;
    } else if (statusFilter !== 'all') {
      if (task.status !== statusFilter) return false;
    }

    // Priority Filter
    if (priorityFilter !== 'all') {
      if (task.priority !== priorityFilter) return false;
    }

    return true;
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const paginatedTasks = filteredTasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <>
      <Helmet>
        <title> Task Management | MK Gold </title>
      </Helmet>

      <Snackbar
        open={notify.open}
        autoHideDuration={4000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.type} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl">
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Task Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Assign, monitor, and track tasks across roles and employees
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RefreshIcon />}
              onClick={fetchTasks}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
              New Task
            </Button>
          </Stack>
        </Stack>

        {/* Stats Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: 'pointer',
                border: statusFilter === 'all' ? '2px solid #6366F1' : '1px solid transparent',
                bgcolor: 'background.paper',
              }}
              onClick={() => {
                setStatusFilter('all');
                setPage(0);
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    TOTAL TASKS
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {totalCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.lighter', color: 'primary.main', width: 44, height: 44 }}>
                  <AssignmentIcon />
                </Avatar>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: 'pointer',
                border: statusFilter === 'pending' ? '2px solid #F59E0B' : '1px solid transparent',
                bgcolor: 'background.paper',
              }}
              onClick={() => {
                setStatusFilter('pending');
                setPage(0);
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="warning.main" fontWeight="bold">
                    PENDING
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {pendingCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.lighter', color: 'warning.main', width: 44, height: 44 }}>
                  <PendingActionsIcon />
                </Avatar>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: 'pointer',
                border: statusFilter === 'completed' ? '2px solid #10B981' : '1px solid transparent',
                bgcolor: 'background.paper',
              }}
              onClick={() => {
                setStatusFilter('completed');
                setPage(0);
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="success.main" fontWeight="bold">
                    COMPLETED
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {completedCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.lighter', color: 'success.main', width: 44, height: 44 }}>
                  <TaskAltIcon />
                </Avatar>
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: 'pointer',
                border: statusFilter === 'overdue' ? '2px solid #EF4444' : '1px solid transparent',
                bgcolor: 'background.paper',
              }}
              onClick={() => {
                setStatusFilter('overdue');
                setPage(0);
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="error.main" fontWeight="bold">
                    OVERDUE
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {overdueCount}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.lighter', color: 'error.main', width: 44, height: 44 }}>
                  <WarningAmberIcon />
                </Avatar>
              </Stack>
            </Card>
          </Grid>
        </Grid>


        {/* Filter Toolbar */}
        <Card sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={5}>
              <TextField
                fullWidth
                size="small"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Search by title, description, employee..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="accepted">Accepted</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="overdue">Overdue Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={6} sm={3} md={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={priorityFilter}
                  label="Priority"
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={12} md={2} sx={{ textAlign: 'right' }}>
              <Typography variant="body2" color="text.secondary">
                Showing <b>{filteredTasks.length}</b> tasks
              </Typography>
            </Grid>
          </Grid>
        </Card>

        {/* Task Table */}
        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 900 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'background.neutral' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Assigned To</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Files</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Loading tasks...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                          No tasks found matching your filters.
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          sx={{ mt: 1 }}
                          onClick={() => {
                            setSearch('');
                            setStatusFilter('all');
                            setPriorityFilter('all');
                          }}
                        >
                          Clear Filters
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTasks.map((task) => {
                      const priorityMeta = PRIORITIES[task.priority] || PRIORITIES.medium;
                      const statusMeta = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
                      const isTaskOverdue =
                        task.deadline &&
                        new Date(task.deadline) < now &&
                        task.status !== 'completed' &&
                        task.status !== 'cancelled';

                      return (
                        <TableRow key={task._id} hover>
                          {/* Task Title & Type */}
                          <TableCell sx={{ maxWidth: 320 }}>
                            <Stack spacing={0.5}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Chip
                                  size="small"
                                  label={task.taskType || 'General'}
                                  variant="outlined"
                                  color="primary"
                                  sx={{ fontSize: '0.72rem', height: 20 }}
                                />
                              </Stack>
                              <Typography
                                variant="subtitle2"
                                fontWeight="bold"
                                sx={{ cursor: 'pointer', '&:hover': { color: 'primary.main' } }}
                                onClick={() => handleOpenDetail(task)}
                              >
                                {task.title}
                              </Typography>
                              {task.description && (
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {task.description}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>

                          {/* Priority */}
                          <TableCell>
                            <Chip
                              size="small"
                              label={priorityMeta.label}
                              color={priorityMeta.color}
                              icon={<FlagIcon fontSize="small" />}
                            />
                          </TableCell>

                          {/* Assigned To */}
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Stack spacing={0.5}>
                              {task.assignedEmployees?.length > 0 ? (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <AvatarGroup max={3} sx={{ justifyContent: 'flex-start' }}>
                                    {task.assignedEmployees.map((emp) => (
                                      <Tooltip
                                        key={emp._id || emp}
                                        title={`[${emp.employeeId || 'ID'}] ${emp.name} (${emp.designation || 'Staff'})`}
                                      >
                                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                                        </Avatar>
                                      </Tooltip>
                                    ))}
                                  </AvatarGroup>
                                  {task.assignedEmployees.length === 1 && (
                                    <Typography variant="caption" noWrap fontWeight="500">
                                      {task.assignedEmployees[0]?.name}
                                    </Typography>
                                  )}
                                </Stack>
                              ) : (
                                <Typography variant="caption" color="text.secondary">
                                  Unassigned
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>


                          {/* Deadline */}
                          <TableCell>
                            {task.deadline ? (
                              <Stack spacing={0.25}>
                                <Typography
                                  variant="body2"
                                  fontWeight={isTaskOverdue ? 'bold' : 'normal'}
                                  color={isTaskOverdue ? 'error.main' : 'text.primary'}
                                >
                                  {moment(task.deadline).format('DD MMM YYYY')}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color={isTaskOverdue ? 'error.main' : 'text.secondary'}
                                  fontWeight={isTaskOverdue ? 'bold' : 'normal'}
                                >
                                  {isTaskOverdue
                                    ? `Overdue (${moment(task.deadline).fromNow()})`
                                    : moment(task.deadline).format('hh:mm A')}
                                </Typography>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No deadline
                              </Typography>
                            )}
                          </TableCell>

                          {/* Files */}
                          <TableCell>
                            {task.attachments?.length > 0 ? (
                              <Chip
                                size="small"
                                icon={<AttachFileIcon fontSize="small" />}
                                label={task.attachments.length}
                                variant="outlined"
                                onClick={() => handleOpenDetail(task)}
                                sx={{ cursor: 'pointer' }}
                              />
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                None
                              </Typography>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="View Details">
                                <IconButton size="small" color="primary" onClick={() => handleOpenDetail(task)}>
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Edit Task">
                                <IconButton size="small" color="info" onClick={() => handleOpenEdit(task)}>
                                  <EditOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Task">
                                <IconButton size="small" color="error" onClick={() => handleOpenDelete(task)}>
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Form Dialog for Create & Edit */}
      <TaskFormDialog
        open={formDialogOpen}
        onClose={() => setFormDialogOpen(false)}
        taskData={editTaskData}
        onSuccess={handleFormSuccess}
      />

      {/* Detail Dialog */}
      <TaskDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        task={detailTaskData}
        onStatusUpdated={handleDetailStatusUpdated}
        isEmployee={false}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete task <b>&quot;{taskToDelete?.title}&quot;</b>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
