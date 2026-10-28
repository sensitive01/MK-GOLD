import { Helmet } from 'react-helmet-async';
import { useState, useEffect, forwardRef } from 'react';
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
  Grid,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableHead,
  CircularProgress,
  Avatar,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import FlagIcon from '@mui/icons-material/Flag';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import moment from 'moment';

import Scrollbar from '../../components/scrollbar';
import { getMyTasks, updateTaskStatus } from '../../apis/admin/task';
import { TaskDetailDialog } from '../../components/admin/task';

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

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Detail Dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTaskData, setDetailTaskData] = useState(null);

  // Notification
  const [notify, setNotify] = useState({ open: false, message: '', type: 'success' });

  const fetchMyTasks = async () => {
    setLoading(true);
    try {
      const res = await getMyTasks();
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
    fetchMyTasks();
  }, []);

  const handleOpenDetail = (task) => {
    setDetailTaskData(task);
    setDetailDialogOpen(true);
  };

  const handleDetailStatusUpdated = (updatedTask) => {
    setNotify({ open: true, message: 'Status updated successfully', type: 'success' });
    setDetailTaskData(updatedTask);
    fetchMyTasks();
  };

  const now = new Date();
  const totalCount = tasks.length;
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const overdueCount = tasks.filter(
    (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'completed' && t.status !== 'cancelled'
  ).length;

  const filteredTasks = tasks.filter((task) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchType = task.taskType?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchType) return false;
    }

    if (statusFilter === 'overdue') {
      const isPast = task.deadline && new Date(task.deadline) < now;
      if (!isPast || task.status === 'completed' || task.status === 'cancelled') return false;
    } else if (statusFilter !== 'all') {
      if (task.status !== statusFilter) return false;
    }

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
        <title> My Tasks | MK Gold </title>
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
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              My Tasks
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and update progress on tasks assigned to you
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RefreshIcon />}
            onClick={fetchMyTasks}
            disabled={loading}
          >
            Refresh
          </Button>
        </Stack>

        {/* Stats Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              sx={{
                p: 2,
                cursor: 'pointer',
                border: statusFilter === 'all' ? '2px solid #6366F1' : '1px solid transparent',
              }}
              onClick={() => {
                setStatusFilter('all');
                setPage(0);
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    ASSIGNED TO ME
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
                placeholder="Search my tasks..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={6} sm={3} md={3}>
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

            <Grid item xs={6} sm={3} md={2}>
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
                  <MenuItem value="all">All</MenuItem>
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

        {/* Tasks Table */}
        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'background.neutral' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Task</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Deadline</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Attachments</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <CircularProgress />
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          Loading tasks...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : paginatedTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                        <Typography variant="subtitle1" color="text.secondary">
                          No tasks assigned to you right now.
                        </Typography>
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
                          <TableCell sx={{ maxWidth: 350 }}>
                            <Stack spacing={0.5}>
                              <Chip
                                size="small"
                                label={task.taskType || 'General'}
                                variant="outlined"
                                color="primary"
                                sx={{ fontSize: '0.72rem', height: 20, width: 'fit-content' }}
                              />
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

                          <TableCell>
                            <Chip
                              size="small"
                              label={priorityMeta.label}
                              color={priorityMeta.color}
                              icon={<FlagIcon fontSize="small" />}
                            />
                          </TableCell>

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

                          <TableCell>
                            <Chip size="small" label={statusMeta.label} color={statusMeta.color} />
                          </TableCell>

                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              {task.status === 'pending' && (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="info"
                                  startIcon={<ThumbUpAltIcon fontSize="small" />}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      const res = await updateTaskStatus(task._id, {
                                        status: 'accepted',
                                        remarks: 'Task accepted by employee',
                                      });
                                      if (res.status) {
                                        handleDetailStatusUpdated(res.data);
                                      } else {
                                        setNotify({ open: true, message: res.message || 'Error', type: 'error' });
                                      }
                                    } catch (err) {
                                      setNotify({ open: true, message: err.message, type: 'error' });
                                    }
                                  }}
                                  sx={{ textTransform: 'none', fontWeight: 'bold' }}
                                >
                                  Accept
                                </Button>
                              )}
                              <Tooltip title="View / Update Task">
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                                  onClick={() => handleOpenDetail(task)}
                                >
                                  View / Update
                                </Button>
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
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTasks.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Detail Dialog with Status Update form */}
      <TaskDetailDialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        task={detailTaskData}
        onStatusUpdated={handleDetailStatusUpdated}
        isEmployee
      />
    </>
  );
}
