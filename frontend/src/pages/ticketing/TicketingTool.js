import { useState, useEffect, forwardRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
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
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { LoadingButton } from '@mui/lab';
import moment from 'moment';

// Icons
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbUpAltIcon from '@mui/icons-material/ThumbUpAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
import {
  getMyRaisedTickets,
  getAssignedTickets,
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
  deleteTicket,
  getTicketDesignations,
  getTicketEmployees,
} from '../../apis/ticket';

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const PRIORITIES = {
  high: { label: 'High', color: 'error', bg: '#fee2e2', text: '#dc2626' },
  medium: { label: 'Medium', color: 'warning', bg: '#fef3c7', text: '#d97706' },
  low: { label: 'Low', color: 'info', bg: '#e0f2fe', text: '#0284c7' },
};

const STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'warning', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  accepted: { label: 'Accepted', color: 'info', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  completed: { label: 'Completed', color: 'success', bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
  rejected: { label: 'Rejected', color: 'error', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
};

export default function TicketingTool() {
  const auth = useSelector((state) => state.auth);
  const currentUser = auth?.user;
  const isAdminOrHr = ['admin', 'subadmin', 'hr'].includes(currentUser?.userType);

  const [activeTab, setActiveTab] = useState('assigned'); // 'assigned' | 'raised' | 'all'
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Metadata for Create Form
  const [designations, setDesignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Create Ticket Dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [deadline, setDeadline] = useState(moment().add(2, 'days').format('YYYY-MM-DD'));
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);

  // Detail Dialog
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [detailTicket, setDetailTicket] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Action Prompt Dialog (Accept / Reject / Complete)
  const [statusActionDialog, setStatusActionDialog] = useState({
    open: false,
    ticketId: null,
    targetStatus: '',
    title: '',
    remarks: '',
  });
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Delete Confirm Dialog
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ticketId: null });

  // Notifications Toast
  const [notify, setNotify] = useState({ open: false, message: '', type: 'success' });

  // Load Metadata
  useEffect(() => {
    getTicketDesignations().then((res) => {
      if (res.status && Array.isArray(res.data)) {
        setDesignations(res.data);
      }
    });
  }, []);

  // When designation changes in create form, fetch matching employees
  useEffect(() => {
    if (createDialogOpen) {
      setLoadingEmployees(true);
      getTicketEmployees(selectedDesignation)
        .then((res) => {
          if (res.status && Array.isArray(res.data)) {
            setEmployees(res.data);
          } else {
            setEmployees([]);
          }
        })
        .finally(() => setLoadingEmployees(false));
    }
  }, [selectedDesignation, createDialogOpen]);

  // Fetch Tickets according to active tab
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (priorityFilter !== 'all') params.priority = priorityFilter;
      if (search) params.search = search;

      let res;
      if (activeTab === 'assigned') {
        res = await getAssignedTickets(params);
      } else if (activeTab === 'raised') {
        res = await getMyRaisedTickets(params);
      } else if (activeTab === 'all') {
        res = await getAllTickets(params);
      }

      if (res?.status && Array.isArray(res.data)) {
        setTickets(res.data);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Fetch tickets error:', err);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, statusFilter, priorityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchTickets();
  };

  // Proof File Select Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProofFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => setProofPreview(reader.result);
        reader.readAsDataURL(file);
      } else {
        setProofPreview(null);
      }
    }
  };

  const handleClearFile = () => {
    setProofFile(null);
    setProofPreview(null);
  };

  const handleOpenCreate = () => {
    setIssueType('');
    setSelectedDesignation('');
    setSelectedEmployee('');
    setSubject('');
    setDescription('');
    setPriority('medium');
    setDeadline(moment().add(2, 'days').format('YYYY-MM-DD'));
    setProofFile(null);
    setProofPreview(null);
    setCreateDialogOpen(true);
  };

  // Submit New Ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!issueType.trim()) {
      setNotify({ open: true, message: 'Please specify the Issue Type', type: 'error' });
      return;
    }
    if (!selectedDesignation) {
      setNotify({ open: true, message: 'Please select a Designation', type: 'error' });
      return;
    }
    if (!selectedEmployee) {
      setNotify({ open: true, message: 'Please select an Employee to ticket', type: 'error' });
      return;
    }
    if (!subject.trim()) {
      setNotify({ open: true, message: 'Please provide a Subject', type: 'error' });
      return;
    }
    if (!description.trim()) {
      setNotify({ open: true, message: 'Please provide a Description', type: 'error' });
      return;
    }
    if (!deadline) {
      setNotify({ open: true, message: 'Please specify a Deadline', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('issueType', issueType.trim());
      formData.append('designation', selectedDesignation);
      formData.append('assignedEmployee', selectedEmployee);
      formData.append('subject', subject.trim());
      formData.append('description', description.trim());
      formData.append('priority', priority);
      formData.append('deadline', deadline);
      if (proofFile) {
        formData.append('proof', proofFile);
      }

      const res = await createTicket(formData);
      if (res.status) {
        setNotify({ open: true, message: res.message || 'Ticket raised successfully!', type: 'success' });
        setCreateDialogOpen(false);
        setActiveTab('raised');
        fetchTickets();
      } else {
        setNotify({ open: true, message: res.message || 'Failed to raise ticket', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message || 'Error raising ticket', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // View Ticket Details
  const handleOpenDetail = async (ticket) => {
    setDetailDialogOpen(true);
    setDetailLoading(true);
    setDetailTicket(ticket);
    try {
      const res = await getTicketById(ticket._id);
      if (res.status && res.data) {
        setDetailTicket(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Status Update Trigger
  const handleTriggerStatusChange = (ticketId, targetStatus) => {
    const titles = {
      accepted: 'Accept Ticket',
      rejected: 'Reject Ticket',
      completed: 'Complete Ticket',
    };
    setStatusActionDialog({
      open: true,
      ticketId,
      targetStatus,
      title: titles[targetStatus] || 'Update Status',
      remarks: '',
    });
  };

  const handleConfirmStatusChange = async () => {
    const { ticketId, targetStatus, remarks } = statusActionDialog;
    if (!ticketId || !targetStatus) return;

    setStatusUpdating(true);
    try {
      const res = await updateTicketStatus(ticketId, {
        status: targetStatus,
        statusRemarks: remarks.trim(),
      });
      if (res.status) {
        setNotify({ open: true, message: res.message || `Ticket marked as ${targetStatus}!`, type: 'success' });
        setStatusActionDialog({ open: false, ticketId: null, targetStatus: '', title: '', remarks: '' });
        if (detailDialogOpen && detailTicket?._id === ticketId) {
          handleOpenDetail({ _id: ticketId });
        }
        fetchTickets();
      } else {
        setNotify({ open: true, message: res.message || 'Failed to update status', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message || 'Status update error', type: 'error' });
    } finally {
      setStatusUpdating(false);
    }
  };

  // Delete Ticket
  const handleDeleteTicket = async () => {
    if (!deleteDialog.ticketId) return;
    try {
      const res = await deleteTicket(deleteDialog.ticketId);
      if (res.status) {
        setNotify({ open: true, message: 'Ticket deleted successfully!', type: 'success' });
        setDeleteDialog({ open: false, ticketId: null });
        if (detailDialogOpen && detailTicket?._id === deleteDialog.ticketId) {
          setDetailDialogOpen(false);
        }
        fetchTickets();
      } else {
        setNotify({ open: true, message: res.message || 'Failed to delete ticket', type: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: err.message || 'Delete error', type: 'error' });
    }
  };

  // Copy Ticket ID
  const handleCopyId = (ticketNumber) => {
    navigator.clipboard?.writeText(ticketNumber);
    setNotify({ open: true, message: `Copied ${ticketNumber} to clipboard!`, type: 'info' });
  };

  // KPI Calculations
  const statsTotal = tickets.length;
  const statsPending = tickets.filter((t) => t.status === 'pending').length;
  const statsAccepted = tickets.filter((t) => t.status === 'accepted').length;
  const statsCompleted = tickets.filter((t) => t.status === 'completed').length;
  const statsRejected = tickets.filter((t) => t.status === 'rejected').length;

  return (
    <>
      <Helmet>
        <title>Ticketing Tool | MK Gold</title>
      </Helmet>

      <Container maxWidth="xl" sx={{ pt: 1, pb: 4 }}>
        {/* Header Title & Raise Ticket Button */}
        <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <ConfirmationNumberIcon sx={{ fontSize: 32, color: '#FFD700' }} />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff' }}>
                Ticketing Tool
              </Typography>
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
              Raise, track, and resolve operational issues seamlessly across all departments
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
            sx={{
              bgcolor: '#FFD700',
              color: '#000',
              fontWeight: 800,
              fontSize: '0.95rem',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(255, 215, 0, 0.4)',
              '&:hover': {
                bgcolor: '#e6c200',
                color: '#000',
              },
            }}
          >
            Raise Ticket
          </Button>
        </Stack>

        {/* Top Metric Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, borderRadius: 2, bgcolor: '#ffffff', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Total Tickets
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
                {statsTotal}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, borderRadius: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', boxShadow: '0 2px 10px rgba(245,158,11,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 700 }}>
                Pending Action
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#b45309', mt: 0.5 }}>
                {statsPending}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, borderRadius: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', boxShadow: '0 2px 10px rgba(59,130,246,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#1d4ed8', fontWeight: 700 }}>
                Accepted / In-Progress
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1d4ed8', mt: 0.5 }}>
                {statsAccepted}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, borderRadius: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', boxShadow: '0 2px 10px rgba(16,185,129,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#15803d', fontWeight: 700 }}>
                Completed
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#15803d', mt: 0.5 }}>
                {statsCompleted}
              </Typography>
            </Card>
          </Grid>

          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ p: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', boxShadow: '0 2px 10px rgba(239,68,68,0.08)' }}>
              <Typography variant="caption" sx={{ color: '#b91c1c', fontWeight: 700 }}>
                Rejected
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#b91c1c', mt: 0.5 }}>
                {statsRejected}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Main Content Card */}
        <Card sx={{ borderRadius: 2.5, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
          {/* Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f8fafc', px: 2, pt: 1 }}>
            <Tabs
              value={activeTab}
              onChange={(e, val) => setActiveTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  minHeight: 48,
                },
              }}
            >
              <Tab
                value="assigned"
                label={
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <span>Assigned to Me</span>
                    {activeTab === 'assigned' && statsPending > 0 && (
                      <Chip label={statsPending} size="small" color="warning" sx={{ height: 20, fontSize: '0.75rem', fontWeight: 700 }} />
                    )}
                  </Stack>
                }
              />
              <Tab value="raised" label="My Raised Tickets" />
              {isAdminOrHr && <Tab value="all" label="All Tickets" />}
            </Tabs>
          </Box>

          {/* Filter & Search Bar */}
          <Box sx={{ p: 2.5, bgcolor: '#ffffff' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5} md={6}>
                <form onSubmit={handleSearchSubmit}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search by Ticket #, Subject, Issue Type, or Person..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </form>
              </Grid>

              <Grid item xs={6} sm={3.5} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="accepted">Accepted</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={2.5} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select value={priorityFilter} label="Priority" onChange={(e) => setPriorityFilter(e.target.value)}>
                    <MenuItem value="all">All Priorities</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={1} md={1}>
                <Tooltip title="Refresh Tickets">
                  <IconButton onClick={fetchTickets} color="primary" sx={{ border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          {/* Table */}
          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Ticket ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Issue Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>To (Assignee)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>From (Raised By)</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Deadline</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#334155' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#334155' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <CircularProgress size={36} />
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                        Loading tickets...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <ConfirmationNumberIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#475569' }}>
                        No tickets found
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {activeTab === 'assigned'
                          ? 'No tickets currently assigned to you.'
                          : activeTab === 'raised'
                          ? 'You have not raised any tickets yet.'
                          : 'No tickets matching your filter criteria.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tickets
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const prio = PRIORITIES[row.priority] || PRIORITIES.medium;
                      const stat = STATUS_CONFIG[row.status] || STATUS_CONFIG.pending;
                      const isOverdue = row.status !== 'completed' && moment(row.deadline).isBefore(moment(), 'day');
                      const isAssignedToUser = activeTab === 'assigned' || isAdminOrHr;
                      const isCreator = String(row.createdBy?._id || row.createdBy) === String(currentUser?._id);

                      return (
                        <TableRow hover key={row._id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                          {/* Ticket Number */}
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={0.5}>
                              <Typography
                                variant="subtitle2"
                                onClick={() => handleOpenDetail(row)}
                                sx={{
                                  fontWeight: 700,
                                  color: '#5b21b6',
                                  cursor: 'pointer',
                                  '&:hover': { textDecoration: 'underline' },
                                }}
                              >
                                {row.ticketNumber}
                              </Typography>
                              <Tooltip title="Copy Ticket ID">
                                <IconButton size="small" onClick={() => handleCopyId(row.ticketNumber)} sx={{ p: 0.2 }}>
                                  <ContentCopyIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </TableCell>

                          {/* Issue Type */}
                          <TableCell>
                            <Chip
                              label={row.issueType}
                              size="small"
                              sx={{
                                bgcolor: '#f1f5f9',
                                color: '#334155',
                                fontWeight: 600,
                                border: '1px solid #e2e8f0',
                              }}
                            />
                          </TableCell>

                          {/* Subject & Description */}
                          <TableCell sx={{ maxWidth: 260 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                color: '#1e293b',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {row.subject}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: 'text.secondary',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {row.description}
                            </Typography>
                          </TableCell>

                          {/* To: Assignee */}
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {row.assignedEmployeeName || row.assignedEmployee?.name || 'Unassigned'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.designation || row.assignedEmployee?.designation || ''}
                            </Typography>
                          </TableCell>

                          {/* From: Raised By */}
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {row.creatorName || row.createdBy?.username || 'Unknown'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                              {row.creatorRole || row.createdBy?.userType || ''}
                            </Typography>
                          </TableCell>

                          {/* Priority */}
                          <TableCell>
                            <Chip
                              label={prio.label}
                              size="small"
                              sx={{
                                bgcolor: prio.bg,
                                color: prio.text,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>

                          {/* Deadline */}
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: isOverdue ? 700 : 500,
                                color: isOverdue ? '#dc2626' : '#1e293b',
                              }}
                            >
                              {moment(row.deadline).format('DD MMM YYYY')}
                            </Typography>
                            {isOverdue && (
                              <Typography variant="caption" sx={{ color: '#dc2626', fontWeight: 700 }}>
                                Overdue
                              </Typography>
                            )}
                          </TableCell>

                          {/* Status */}
                          <TableCell>
                            <Chip
                              label={stat.label}
                              size="small"
                              sx={{
                                bgcolor: stat.bg,
                                color: stat.text,
                                border: `1px solid ${stat.border}`,
                                fontWeight: 700,
                              }}
                            />
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right">
                            <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                              <Tooltip title="View Details">
                                <IconButton size="small" color="primary" onClick={() => handleOpenDetail(row)}>
                                  <VisibilityOutlinedIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              {/* Quick Action: Accept */}
                              {isAssignedToUser && row.status === 'pending' && (
                                <Tooltip title="Accept Ticket">
                                  <IconButton
                                    size="small"
                                    color="info"
                                    onClick={() => handleTriggerStatusChange(row._id, 'accepted')}
                                  >
                                    <ThumbUpAltIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Quick Action: Complete */}
                              {isAssignedToUser && row.status === 'accepted' && (
                                <Tooltip title="Mark as Completed">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleTriggerStatusChange(row._id, 'completed')}
                                  >
                                    <CheckCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Quick Action: Reject */}
                              {isAssignedToUser && row.status === 'pending' && (
                                <Tooltip title="Reject Ticket">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleTriggerStatusChange(row._id, 'rejected')}
                                  >
                                    <CancelOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}

                              {/* Delete (if creator and pending, or admin) */}
                              {(isAdminOrHr || (isCreator && row.status === 'pending')) && (
                                <Tooltip title="Delete Ticket">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setDeleteDialog({ open: true, ticketId: row._id })}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={tickets.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      </Container>

      {/* ============================================================== */}
      {/* RAISE TICKET DIALOG */}
      {/* ============================================================== */}
      <Dialog
        open={createDialogOpen}
        onClose={() => !submitting && setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle
          sx={{
            p: 2.5,
            bgcolor: '#5b21b6',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <ConfirmationNumberIcon sx={{ color: '#FFD700', fontSize: 26 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Raise New Ticket
            </Typography>
          </Stack>
          <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setCreateDialogOpen(false)} disabled={submitting}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmitTicket}>
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2.5}>
              {/* Issue Type (text box) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Issue Type *"
                  placeholder="e.g. Software Bug, Printer Glitch, Billing, Attendance"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  helperText="Enter the category or type of issue"
                />
              </Grid>

              {/* Priority */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority *</InputLabel>
                  <Select
                    value={priority}
                    label="Priority *"
                    onChange={(e) => setPriority(e.target.value)}
                    renderValue={(selected) => {
                      const p = PRIORITIES[selected] || PRIORITIES.medium;
                      return <Chip label={p.label} size="small" sx={{ bgcolor: p.bg, color: p.text, fontWeight: 700 }} />;
                    }}
                  >
                    <MenuItem value="low">
                      <Chip label="Low" size="small" sx={{ bgcolor: '#e0f2fe', color: '#0284c7', fontWeight: 700 }} />
                    </MenuItem>
                    <MenuItem value="medium">
                      <Chip label="Medium" size="small" sx={{ bgcolor: '#fef3c7', color: '#d97706', fontWeight: 700 }} />
                    </MenuItem>
                    <MenuItem value="high">
                      <Chip label="High" size="small" sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700 }} />
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Designation Selection */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Target Designation *</InputLabel>
                  <Select
                    value={selectedDesignation}
                    label="Target Designation *"
                    onChange={(e) => {
                      setSelectedDesignation(e.target.value);
                      setSelectedEmployee('');
                    }}
                  >
                    {designations.map((d) => (
                      <MenuItem key={d} value={d}>
                        {d}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Employee To (filtered by designation) */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required disabled={!selectedDesignation || loadingEmployees}>
                  <InputLabel>Employee To (Assignee) *</InputLabel>
                  <Select
                    value={selectedEmployee}
                    label="Employee To (Assignee) *"
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                  >
                    {loadingEmployees ? (
                      <MenuItem disabled>Loading employees...</MenuItem>
                    ) : employees.length === 0 ? (
                      <MenuItem disabled>No employees found for this designation</MenuItem>
                    ) : (
                      employees.map((emp) => (
                        <MenuItem key={emp._id} value={emp._id}>
                          {emp.name} ({emp.employeeId || 'No ID'}{emp.branch?.name ? ` - ${emp.branch.name}` : ''})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>

              {/* Subject */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject *"
                  placeholder="Short, clear summary of the issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </Grid>

              {/* Description */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Description *"
                  placeholder="Detailed description of the problem, steps to reproduce, or requested action..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </Grid>

              {/* Deadline */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Deadline *"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: moment().format('YYYY-MM-DD') }}
                  required
                />
              </Grid>

              {/* Proof File Upload */}
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    border: '1px dashed #cbd5e1',
                    borderRadius: 2,
                    p: 1.5,
                    textAlign: 'center',
                    bgcolor: '#f8fafc',
                  }}
                >
                  {!proofFile ? (
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<AttachFileIcon />}
                      sx={{ textTransform: 'none', borderColor: '#cbd5e1', color: '#475569' }}
                    >
                      Attach Proof (Image / PDF)
                      <input type="file" hidden accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange} />
                    </Button>
                  ) : (
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: 'hidden' }}>
                        {proofPreview ? (
                          <Box
                            component="img"
                            src={proofPreview}
                            alt="preview"
                            sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }}
                          />
                        ) : (
                          <AttachFileIcon sx={{ color: '#5b21b6' }} />
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
                          {proofFile.name}
                        </Typography>
                      </Stack>
                      <IconButton size="small" onClick={handleClearFile} color="error">
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  )}
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <Button onClick={() => setCreateDialogOpen(false)} color="inherit" disabled={submitting}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={submitting}
              sx={{
                bgcolor: '#FFD700',
                color: '#000',
                fontWeight: 800,
                px: 3.5,
                py: 1,
                borderRadius: 1.5,
                boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
                '&:hover': {
                  bgcolor: '#e6c200',
                  color: '#000',
                },
              }}
            >
              Submit Ticket
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>

      {/* ============================================================== */}
      {/* TICKET DETAILS DIALOG */}
      {/* ============================================================== */}
      <Dialog
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        {detailLoading || !detailTicket ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DialogTitle
              sx={{
                p: 2.5,
                bgcolor: '#5b21b6',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {detailTicket.ticketNumber}
                </Typography>
                <Chip
                  label={STATUS_CONFIG[detailTicket.status]?.label || detailTicket.status}
                  size="small"
                  sx={{
                    bgcolor: STATUS_CONFIG[detailTicket.status]?.bg,
                    color: STATUS_CONFIG[detailTicket.status]?.text,
                    fontWeight: 700,
                  }}
                />
                <Chip
                  label={PRIORITIES[detailTicket.priority]?.label || detailTicket.priority}
                  size="small"
                  sx={{
                    bgcolor: PRIORITIES[detailTicket.priority]?.bg,
                    color: PRIORITIES[detailTicket.priority]?.text,
                    fontWeight: 700,
                  }}
                />
              </Stack>
              <IconButton size="small" sx={{ color: '#fff' }} onClick={() => setDetailDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 3 }}>
              {/* Subject & Issue Type */}
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', mb: 1 }}>
                {detailTicket.subject}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                <Chip label={`Issue Type: ${detailTicket.issueType}`} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
                <Chip
                  label={`Deadline: ${moment(detailTicket.deadline).format('DD MMM YYYY')}`}
                  size="small"
                  color={moment(detailTicket.deadline).isBefore(moment(), 'day') && detailTicket.status !== 'completed' ? 'error' : 'default'}
                  sx={{ fontWeight: 600 }}
                />
              </Stack>

              {/* People Cards */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                      To (Assigned Employee)
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.5 }}>
                      {detailTicket.assignedEmployeeName || detailTicket.assignedEmployee?.name || 'Unassigned'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Designation: {detailTicket.designation || detailTicket.assignedEmployee?.designation || '-'}
                    </Typography>
                    {detailTicket.assignedEmployee?.branch?.name && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Branch: {detailTicket.assignedEmployee.branch.name}
                      </Typography>
                    )}
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                      From (Raised By)
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b', mt: 0.5 }}>
                      {detailTicket.creatorName || detailTicket.createdBy?.username || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                      Role: {detailTicket.creatorRole || detailTicket.createdBy?.userType || '-'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Created: {moment(detailTicket.createdAt).format('DD MMM YYYY, hh:mm A')}
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {/* Description */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                  Description:
                </Typography>
                <Paper sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 1.5 }}>
                  <Typography variant="body1" sx={{ color: '#1e293b', whiteSpace: 'pre-wrap' }}>
                    {detailTicket.description}
                  </Typography>
                </Paper>
              </Box>

              {/* Proof Attachment */}
              {detailTicket.proof && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                    Proof / Attachment:
                  </Typography>
                  {detailTicket.proof.match(/\.(jpeg|jpg|gif|png|webp|avif)/i) ? (
                    <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2 }}>
                      <Box
                        component="img"
                        src={detailTicket.proof.startsWith('http') ? detailTicket.proof : `${global.baseURL}/${detailTicket.proof}`}
                        alt="proof"
                        sx={{ maxHeight: 320, maxWidth: '100%', borderRadius: 1.5, objectFit: 'contain' }}
                      />
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      startIcon={<AttachFileIcon />}
                      href={detailTicket.proof.startsWith('http') ? detailTicket.proof : `${global.baseURL}/${detailTicket.proof}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ textTransform: 'none' }}
                    >
                      View / Download Attached Document
                    </Button>
                  )}
                </Box>
              )}

              {/* Status Remarks (if completed or rejected) */}
              {detailTicket.statusRemarks && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                    Resolution / Rejection Notes:
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: detailTicket.status === 'completed' ? '#f0fdf4' : '#fef2f2',
                      border: `1px solid ${detailTicket.status === 'completed' ? '#bbf7d0' : '#fecaca'}`,
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: '#1e293b' }}>
                      {detailTicket.statusRemarks}
                    </Typography>
                    {detailTicket.statusUpdatedAt && (
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.5 }}>
                        Updated on {moment(detailTicket.statusUpdatedAt).format('DD MMM YYYY, hh:mm A')}
                      </Typography>
                    )}
                  </Paper>
                </Box>
              )}

              {/* Audit History */}
              {detailTicket.history && detailTicket.history.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                    Activity History:
                  </Typography>
                  <Stack spacing={1}>
                    {detailTicket.history.map((h, idx) => (
                      <Stack
                        key={idx}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          p: 1.2,
                          bgcolor: '#f8fafc',
                          borderRadius: 1.5,
                          border: '1px solid #e2e8f0',
                        }}
                      >
  
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip
                            label={STATUS_CONFIG[h.status]?.label || h.status}
                            size="small"
                            sx={{
                              bgcolor: STATUS_CONFIG[h.status]?.bg,
                              color: STATUS_CONFIG[h.status]?.text,
                              fontWeight: 700,
                            }}
                          />
                          <Typography variant="body2" sx={{ color: '#334155' }}>
                            {h.remarks || `Status changed to ${h.status}`}
                          </Typography>
                        </Stack>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {moment(h.updatedAt).format('DD MMM, hh:mm A')}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
              <Button onClick={() => setDetailDialogOpen(false)} color="inherit">
                Close
              </Button>

              <Stack direction="row" spacing={1.5}>
                {/* Accept (if pending) */}
                {detailTicket.status === 'pending' && (
                  <Button
                    variant="contained"
                    color="info"
                    startIcon={<ThumbUpAltIcon />}
                    onClick={() => handleTriggerStatusChange(detailTicket._id, 'accepted')}
                  >
                    Accept Ticket
                  </Button>
                )}

                {/* Reject (if pending) */}
                {detailTicket.status === 'pending' && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<CancelOutlinedIcon />}
                    onClick={() => handleTriggerStatusChange(detailTicket._id, 'rejected')}
                  >
                    Reject Ticket
                  </Button>
                )}

                {/* Complete (if accepted) */}
                {detailTicket.status === 'accepted' && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => handleTriggerStatusChange(detailTicket._id, 'completed')}
                  >
                    Mark as Completed
                  </Button>
                )}
              </Stack>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* ============================================================== */}
      {/* STATUS ACTION REMARKS DIALOG */}
      {/* ============================================================== */}
      <Dialog
        open={statusActionDialog.open}
        onClose={() => !statusUpdating && setStatusActionDialog({ ...statusActionDialog, open: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>{statusActionDialog.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {statusActionDialog.targetStatus === 'rejected'
              ? 'Please provide a reason for rejecting this ticket (optional):'
              : statusActionDialog.targetStatus === 'completed'
              ? 'Please provide completion remarks or resolution notes (optional):'
              : 'Are you sure you want to accept this ticket and start working on it?'}
          </Typography>
          {(statusActionDialog.targetStatus === 'rejected' || statusActionDialog.targetStatus === 'completed') && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Remarks / Notes"
              placeholder="Enter remarks..."
              value={statusActionDialog.remarks}
              onChange={(e) => setStatusActionDialog({ ...statusActionDialog, remarks: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setStatusActionDialog({ ...statusActionDialog, open: false })} disabled={statusUpdating} color="inherit">
            Cancel
          </Button>
          <LoadingButton
            variant="contained"
            color={statusActionDialog.targetStatus === 'rejected' ? 'error' : statusActionDialog.targetStatus === 'completed' ? 'success' : 'info'}
            loading={statusUpdating}
            onClick={handleConfirmStatusChange}
          >
            Confirm
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* DELETE CONFIRM DIALOG */}
      {/* ============================================================== */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, ticketId: null })}>
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Ticket?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Are you sure you want to permanently delete this ticket? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, ticketId: null })} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteTicket}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ============================================================== */}
      {/* NOTIFICATION SNACKBAR */}
      {/* ============================================================== */}
      <Snackbar
        open={notify.open}
        autoHideDuration={4000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={notify.type} onClose={() => setNotify({ ...notify, open: false })} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>
    </>
  );
}

