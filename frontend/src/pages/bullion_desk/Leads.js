import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import {
  Backdrop,
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  MenuItem,
  Modal,
  Paper,
  Popover,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Tooltip,
  Chip,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import * as XLSX from 'xlsx';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { CreateLead, UpdateLead, PreviewLead } from '../../components/branch/lead';
import AddCallLogModal from '../../components/branch/lead/AddCallLogModal';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import { AttendanceListHead } from '../../sections/@dashboard/attendance';
import LeadListToolbar from '../../sections/@dashboard/lead/LeadListToolbar';
import LeadFilterSidebar from '../../sections/@dashboard/lead/LeadFilterSidebar';
import { deleteLeadById, getLeads, assignExecutive, getBranchExecutives, bullionApproveLead, bullionRejectLead } from '../../apis/branch/lead';
import { getBranch } from '../../apis/branch/branch';
import global from '../../utils/global';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'mobile', label: 'Mobile', alignRight: false },
  { id: 'category', label: 'Category', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'weight', label: 'Weight', alignRight: false },
  { id: 'source', label: 'Source', alignRight: false },
  { id: 'approvedDate', label: 'Approved Date', alignRight: false },
  { id: 'assignedExecutive', label: 'Assigned Executive', alignRight: false },
  { id: 'remarks', label: 'Remarks', alignRight: false },
  { id: 'disposition', label: 'Status', alignRight: false },
  { id: '' },
];

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  if (orderBy === 'source') {
    aValue = (a.source || '').toLowerCase();
    bValue = (b.source || '').toLowerCase();
  } else if (orderBy === 'assignedExecutive') {
    aValue = (a.assignedExecutive?.employee?.name || a.assignedExecutiveName || '').toLowerCase();
    bValue = (b.assignedExecutive?.employee?.name || b.assignedExecutiveName || '').toLowerCase();
  } else if (orderBy === 'disposition') {
    aValue = (a.dispositions?.length > 0 ? a.dispositions[a.dispositions.length - 1].status : '').toLowerCase();
    bValue = (b.dispositions?.length > 0 ? b.dispositions[b.dispositions.length - 1].status : '').toLowerCase();
  }

  if (bValue < aValue) {
    return -1;
  }
  if (bValue > aValue) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query, filters, currentTab) {
  const stabilizedThis = array?.map((el, index) => [el, index]) || [];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredArray = stabilizedThis?.map((el) => el[0]) || [];

  if (query) {
    const lowerQuery = query.toLowerCase();
    filteredArray = filter(filteredArray, (row) => {
      const nameMatch = String(row?.name || '').toLowerCase().includes(lowerQuery);
      const mobileMatch = String(row?.mobile || '').toLowerCase().includes(lowerQuery);
      return nameMatch || mobileMatch;
    });
  }

  if (filters) {
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate).setHours(0, 0, 0, 0) : null;
      const end = filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : null;
      filteredArray = filteredArray.filter((row) => {
        const dateValue = row.tlApprovedAt || row.approvedDate || row.updatedAt || row.date || row.createdAt;
        if (!dateValue) return true;
        const itemDate = new Date(dateValue).getTime();
        if (start && end) return itemDate >= start && itemDate <= end;
        if (start) return itemDate >= start;
        if (end) return itemDate <= end;
        return true;
      });
    }
    if (filters.status && filters.status !== 'all') {
      filteredArray = filteredArray.filter((row) => row.status?.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.source && filters.source !== 'all') {
      filteredArray = filteredArray.filter((row) => (row.source || '').trim().toLowerCase() === filters.source.trim().toLowerCase());
    }
    if (filters.category && filters.category.length > 0) {
      filteredArray = filteredArray.filter((row) => filters.category.includes(row.category?.toLowerCase()));
    }
    if (filters.type && filters.type.length > 0) {
      filteredArray = filteredArray.filter((row) => filters.type.includes(row.type?.toLowerCase()));
    }
    if (filters.isExclusive && filters.isExclusive !== 'all') {
      filteredArray = filteredArray.filter((row) => row.isExclusive === true);
    }
  }

  if (currentTab === 'pending') {
    filteredArray = filteredArray.filter(
      (row) =>
        (!row.bullionStatus || row.bullionStatus === 'pending') &&
        !row.assignedExecutive &&
        !row.assignedExecutiveName &&
        row.status !== 'rejected' &&
        row.bullionStatus !== 'rejected'
    );
  } else if (currentTab === 'unassigned') {
    filteredArray = filteredArray.filter(
      (row) =>
        !row.assignedExecutive &&
        !row.assignedExecutiveName &&
        (row.bullionStatus === 'approved' || (!row.bullionStatus && row.tlStatus === 'approved')) &&
        row.status !== 'rejected' &&
        row.bullionStatus !== 'rejected'
    );
  } else if (currentTab === 'assigned') {
    filteredArray = filteredArray.filter(
      (row) => (row.assignedExecutive || row.assignedExecutiveName) && row.status !== 'rejected' && row.bullionStatus !== 'rejected'
    );
  } else if (currentTab === 'follow_ups') {
    filteredArray = filteredArray.filter((row) => {
      if (row.status === 'rejected' || row.bullionStatus === 'rejected' || row.status === 'converted') return false;
      if (!row.dispositions || row.dispositions.length === 0) return false;
      const lastDisp = row.dispositions[row.dispositions.length - 1].status;
      return ['Callback', 'Follow Up', 'Planning to Visit', 'Visited Branch'].includes(lastDisp);
    });
  } else if (currentTab === 'converted') {
    filteredArray = filteredArray.filter((row) => row.status === 'converted');
  } else if (currentTab === 'rejected') {
    filteredArray = filteredArray.filter((row) => row.status === 'rejected' || row.bullionStatus === 'rejected');
  }

  return filteredArray;
}

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 440,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1.5,
};

export default function BullionDeskLeads({ title = "Bullion Desk Leads" }) {
  const auth = useSelector((state) => state.auth);
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [visiblePhoneId, setVisiblePhoneId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('approvedDate');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [autoOpenLogModal, setAutoOpenLogModal] = useState(false);
  const [data, setData] = useState([]);
  const [currentTab, setCurrentTab] = useState('all');

  // Assign Executive Modal states
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [assigningLeadId, setAssigningLeadId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branchExecutives, setBranchExecutives] = useState([]);
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [loadingExecutives, setLoadingExecutives] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Bullion Approve & Reject Modal states
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [rejectingLead, setRejectingLead] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectError, setRejectError] = useState(false);
  const [submittingReject, setSubmittingReject] = useState(false);

  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    source: 'all',
    category: [],
    type: [],
    isExclusive: 'all',
  });

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(() => {
    setOpenBackdrop(true);
    // Bullion Desk queries leads approved by Telecaller TL
    getLeads({ $or: [{ isMovedToBullionDesk: true }, { tlStatus: 'approved' }] })
      .then((res) => {
        setData(res?.data || []);
        setOpenBackdrop(false);
      })
      .catch(() => {
        setOpenBackdrop(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
    getBranch().then((res) => {
      setBranches(res?.data || []);
    });
  }, [fetchData, toggleContainer]);

  const handleOpenAssignModal = (lead) => {
    setAssigningLeadId(lead._id);
    const currBranchId = lead.branch?._id || lead.branch || '';
    const currExecId = lead.assignedExecutive?._id || lead.assignedExecutive || '';
    setSelectedBranchId(currBranchId);
    setSelectedExecutiveId(currExecId);
    if (currBranchId) {
      setLoadingExecutives(true);
      getBranchExecutives(currBranchId).then((res) => {
        setBranchExecutives(res?.data || []);
        setLoadingExecutives(false);
      });
    } else {
      setBranchExecutives([]);
    }
    setOpenAssignModal(true);
  };

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    setSelectedBranchId(bId);
    setSelectedExecutiveId('');
    if (bId) {
      setLoadingExecutives(true);
      getBranchExecutives(bId).then((res) => {
        setBranchExecutives(res?.data || []);
        setLoadingExecutives(false);
      });
    } else {
      setBranchExecutives([]);
    }
  };

  const handleAssignSubmit = () => {
    if (!selectedBranchId || !selectedExecutiveId) {
      setNotify({ open: true, message: 'Please select both branch and executive', severity: 'warning' });
      return;
    }
    setAssigning(true);
    const chosenExec = branchExecutives.find((e) => e._id === selectedExecutiveId);
    const execName = chosenExec ? chosenExec.name : '';

    assignExecutive(assigningLeadId, {
      branch: selectedBranchId,
      assignedExecutive: selectedExecutiveId,
      assignedExecutiveName: execName,
    })
      .then((res) => {
        setAssigning(false);
        if (res?.status) {
          setNotify({ open: true, message: 'Executive assigned successfully!', severity: 'success' });
          setOpenAssignModal(false);
          fetchData();
        } else {
          setNotify({ open: true, message: res?.message || 'Failed to assign executive', severity: 'error' });
        }
      })
      .catch(() => {
        setAssigning(false);
        setNotify({ open: true, message: 'An error occurred', severity: 'error' });
      });
  };

  const handleApproveLead = async (id) => {
    try {
      setOpenBackdrop(true);
      const res = await bullionApproveLead(id);
      setOpenBackdrop(false);
      if (res?.status) {
        setNotify({
          open: true,
          message: 'Lead approved by Bullion Desk! You can now assign an executive.',
          severity: 'success',
        });
        fetchData();
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to approve lead',
          severity: 'error',
        });
      }
    } catch (err) {
      setOpenBackdrop(false);
      setNotify({
        open: true,
        message: err.message || 'Error approving lead',
        severity: 'error',
      });
    }
  };

  const handleOpenRejectModal = (lead) => {
    setRejectingLead(lead);
    setRejectComment('');
    setRejectError(false);
    setOpenRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    if (!submittingReject) {
      setOpenRejectModal(false);
      setRejectingLead(null);
      setRejectComment('');
      setRejectError(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectComment.trim()) {
      setRejectError(true);
      return;
    }
    try {
      setSubmittingReject(true);
      const res = await bullionRejectLead(rejectingLead._id, rejectComment.trim());
      setSubmittingReject(false);
      if (res?.status) {
        setOpenRejectModal(false);
        setRejectingLead(null);
        setRejectComment('');
        setNotify({
          open: true,
          message: 'Lead rejected successfully',
          severity: 'info',
        });
        fetchData();
      } else {
        setNotify({
          open: true,
          message: res?.message || 'Failed to reject lead',
          severity: 'error',
        });
      }
    } catch (err) {
      setSubmittingReject(false);
      setNotify({
        open: true,
        message: err.message || 'Error rejecting lead',
        severity: 'error',
      });
    }
  };

  const handleOpenMenu = (event) => {
    setOpen(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpen(null);
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = data?.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleDelete = () => {
    deleteLeadById(openId).then((res) => {
      if (res?.status) {
        setNotify({ open: true, message: 'Lead deleted successfully', severity: 'success' });
        handleCloseDeleteModal();
        handleCloseMenu();
        fetchData();
      } else {
        setNotify({ open: true, message: res?.message || 'Error deleting lead', severity: 'error' });
      }
    });
  };

  const handleDeleteSelected = () => {
    deleteLeadById(selected.join(',')).then((res) => {
      if (res?.status) {
        setNotify({ open: true, message: `${selected.length} Leads deleted successfully`, severity: 'success' });
        setSelected([]);
        handleCloseDeleteModal();
        fetchData();
      } else {
        setNotify({ open: true, message: res?.message || 'Error deleting leads', severity: 'error' });
      }
    });
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      setNotify({ open: true, message: 'No leads available to export', severity: 'warning' });
      return;
    }

    const exportRows = data.map((item) => ({
      'Lead Name': item.name || '',
      'Mobile Number': item.mobile || '',
      Category: item.category || '',
      Type: item.type || '',
      'Weight (gm)': item.weight || '',
      'Approved Date': item.tlApprovedAt ? moment(item.tlApprovedAt).format('YYYY-MM-DD HH:mm') : moment(item.updatedAt).format('YYYY-MM-DD'),
      'Assigned Executive': item.assignedExecutive?.employee?.name || item.assignedExecutiveName || 'Unassigned',
      'Assigned Branch': item.branch?.branchName || '',
      Status: item.status || '',
      'Latest Remark': item.dispositions?.length > 0 ? item.dispositions[item.dispositions.length - 1].remark : item.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Bullion_Desk_Leads');
    XLSX.writeFile(workbook, `Bullion_Desk_Leads_${moment().format('YYYYMMDD')}.xlsx`);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters, currentTab);

  return (
    <>
      <Helmet>
        <title>Bullion Desk | Leads Management</title>
      </Helmet>

      <Snackbar
        open={notify.open}
        autoHideDuration={6000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ display: toggleContainer ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Box>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Bullion Desk Leads
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Approved business leads received from Telecaller-TL
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:download-fill" />}
              onClick={handleExportExcel}
              sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#388E3C' } }}
            >
              Export Excel
            </Button>
          </Stack>
        </Stack>

        <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', boxShadow: 3 }}>
          <LeadListToolbar
            numSelected={selected.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            onOpenFilter={() => setOpenFilter(true)}
            handleOpenDeleteModal={() => {
              setDeleteType('multiple');
              handleOpenDeleteModal();
            }}
          />

          <LeadFilterSidebar
            openFilter={openFilter}
            onOpenFilter={() => setOpenFilter(true)}
            onCloseFilter={() => setOpenFilter(false)}
            filters={filters}
            setFilters={setFilters}
            sourceOptions={Array.from(new Set(data?.map((d) => d.source).filter(Boolean)))}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 900 }}>
              <Table>
                <AttendanceListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length || 0}
                  numSelected={selected.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                    const { _id, name, mobile, category, type, remarks, status, dispositions } = row;
                    const selectedData = selected.indexOf(_id) !== -1;
                    const displayRemark =
                      dispositions?.length > 0 && dispositions[dispositions.length - 1].remark
                        ? dispositions[dispositions.length - 1].remark
                        : remarks;

                    return (
                      <TableRow
                        hover
                        key={_id}
                        tabIndex={-1}
                        role="checkbox"
                        selected={selectedData}
                        onClick={() => {
                          setOpenId(_id);
                          setAutoOpenLogModal(false);
                          setToggleContainer(true);
                          setToggleContainerType('preview');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedData}
                            onChange={(event) => handleClick(event, _id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell align="left">
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {name}
                          </Typography>
                        </TableCell>
                        <TableCell align="left">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {visiblePhoneId === _id ? mobile : global.maskPhoneNumber(mobile)}
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisiblePhoneId(visiblePhoneId === _id ? null : _id);
                              }}
                              sx={{ ml: 1 }}
                            >
                              <Iconify icon={visiblePhoneId === _id ? 'eva:eye-off-fill' : 'eva:eye-fill'} />
                            </IconButton>
                          </Box>
                        </TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>
                          {category}
                        </TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>
                          {type}
                        </TableCell>
                        <TableCell align="left">
                          {row.weight ? `${row.weight} ${row.unit || 'gm'}` : 'N/A'}
                        </TableCell>
                        <TableCell align="left">
                          {row.source || '-'}
                        </TableCell>
                        <TableCell align="left">
                          {row.tlApprovedAt ? moment(row.tlApprovedAt).format('YYYY-MM-DD') : moment(row.updatedAt).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                          {row.status === 'rejected' || row.bullionStatus === 'rejected' ? (
                            <Tooltip title={row.bullionRejectionReason || row.tlRejectionReason || 'Lead was rejected'}>
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  px: 1.2,
                                  py: 0.4,
                                  borderRadius: 1,
                                  bgcolor: '#ffebee',
                                  color: '#d32f2f',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                <Iconify icon="eva:close-circle-fill" sx={{ width: 14, height: 14 }} />
                                Rejected
                              </Box>
                            </Tooltip>
                          ) : row.assignedExecutive?.employee?.name || row.assignedExecutiveName ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1967d2' }}>
                                {row.assignedExecutive?.employee?.name || row.assignedExecutiveName}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenAssignModal(row);
                                }}
                                title="Change Executive"
                              >
                                <Iconify icon="eva:edit-fill" sx={{ width: 16, height: 16, color: 'text.secondary' }} />
                              </IconButton>
                            </Box>
                          ) : row.bullionStatus === 'approved' ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAssignModal(row);
                              }}
                              startIcon={<PersonAddIcon />}
                              sx={{
                                color: '#8A1B9F',
                                borderColor: '#8A1B9F',
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                                '&:hover': { borderColor: '#731485', bgcolor: 'rgba(138, 27, 159, 0.04)' },
                              }}
                            >
                              Assign Executive
                            </Button>
                          ) : (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#fff !important', width: 14, height: 14 }} />}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  py: 0.4,
                                  px: 1.2,
                                  borderRadius: 1,
                                  color: '#fff !important',
                                  bgcolor: '#2e7d32',
                                  boxShadow: 'none',
                                  whiteSpace: 'nowrap',
                                  '&:hover': {
                                    bgcolor: '#1b5e20',
                                    boxShadow: 'none',
                                  },
                                  '& .MuiButton-startIcon': { color: '#ffffff !important' },
                                  '& svg': { color: '#ffffff !important', fill: '#ffffff !important' },
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveLead(row._id);
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                startIcon={<Iconify icon="eva:close-circle-fill" sx={{ width: 14, height: 14 }} />}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  py: 0.4,
                                  px: 1.2,
                                  borderRadius: 1,
                                  whiteSpace: 'nowrap',
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenRejectModal(row);
                                }}
                              >
                                Reject
                              </Button>
                            </Stack>
                          )}
                        </TableCell>
                        <TableCell
                          align="left"
                          sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={displayRemark || ''}
                        >
                          {displayRemark || '-'}
                        </TableCell>
                        <TableCell align="left">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {dispositions?.length > 0 ? (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenId(_id);
                                  setAutoOpenLogModal(true);
                                }}
                                endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                                color={
                                  dispositions[dispositions.length - 1].status === 'Follow Up' ||
                                  dispositions[dispositions.length - 1].status === 'Planning to Visit'
                                    ? 'success'
                                    : dispositions[dispositions.length - 1].status === 'Business Closed' ||
                                      status?.toLowerCase() === 'converted'
                                    ? 'primary'
                                    : 'inherit'
                                }
                                sx={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                              >
                                {dispositions[dispositions.length - 1].status}
                              </Button>
                            ) : (
                              <Button
                                variant="outlined"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenId(_id);
                                  setAutoOpenLogModal(true);
                                }}
                                endIcon={<Iconify icon="eva:arrow-ios-downward-fill" />}
                                sx={{ whiteSpace: 'nowrap', minWidth: 'max-content' }}
                              >
                                Update Status
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenId(_id);
                              handleOpenMenu(e);
                            }}
                          >
                            <Iconify icon={'eva:more-vertical-fill'} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={10} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No leads found</Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredData?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>

        {/* Quick Filter Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mt: 3, flexWrap: 'wrap' }}>
          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#e8f0fe',
              color: '#1967d2',
              cursor: 'pointer',
              outline: currentTab === 'all' ? '3px solid #1967d2' : 'none',
              transform: currentTab === 'all' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">{data?.length || 0}</Typography>
            <Typography variant="subtitle2">All Received Leads</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('pending');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#fff8e1',
              color: '#b78103',
              cursor: 'pointer',
              outline: currentTab === 'pending' ? '3px solid #b78103' : 'none',
              transform: currentTab === 'pending' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter(
                (row) =>
                  (!row.bullionStatus || row.bullionStatus === 'pending') &&
                  !row.assignedExecutive &&
                  !row.assignedExecutiveName &&
                  row.status !== 'rejected' &&
                  row.bullionStatus !== 'rejected'
              ).length || 0}
            </Typography>
            <Typography variant="subtitle2">Pending Approval</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('unassigned');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#ffe7d9',
              color: '#7a0c2e',
              cursor: 'pointer',
              outline: currentTab === 'unassigned' ? '3px solid #7a0c2e' : 'none',
              transform: currentTab === 'unassigned' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter(
                (row) =>
                  !row.assignedExecutive &&
                  !row.assignedExecutiveName &&
                  (row.bullionStatus === 'approved' || (!row.bullionStatus && row.tlStatus === 'approved')) &&
                  row.status !== 'rejected' &&
                  row.bullionStatus !== 'rejected'
              ).length || 0}
            </Typography>
            <Typography variant="subtitle2">Ready to Assign</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('assigned');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#e6f7ff',
              color: '#096dd9',
              cursor: 'pointer',
              outline: currentTab === 'assigned' ? '3px solid #096dd9' : 'none',
              transform: currentTab === 'assigned' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter((row) => (row.assignedExecutive || row.assignedExecutiveName) && row.status !== 'rejected' && row.bullionStatus !== 'rejected').length || 0}
            </Typography>
            <Typography variant="subtitle2">Assigned Executive</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('follow_ups');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#e4f8dd',
              color: '#135222',
              cursor: 'pointer',
              outline: currentTab === 'follow_ups' ? '3px solid #135222' : 'none',
              transform: currentTab === 'follow_ups' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter((row) => {
                if (row.status === 'rejected' || row.bullionStatus === 'rejected' || row.status === 'converted') return false;
                if (!row.dispositions || row.dispositions.length === 0) return false;
                const lastDisp = row.dispositions[row.dispositions.length - 1].status;
                return ['Callback', 'Follow Up', 'Planning to Visit', 'Visited Branch'].includes(lastDisp);
              }).length || 0}
            </Typography>
            <Typography variant="subtitle2">Follow Ups</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('rejected');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#ffebee',
              color: '#d32f2f',
              cursor: 'pointer',
              outline: currentTab === 'rejected' ? '3px solid #d32f2f' : 'none',
              transform: currentTab === 'rejected' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter((row) => row.status === 'rejected' || row.bullionStatus === 'rejected').length || 0}
            </Typography>
            <Typography variant="subtitle2">Rejected</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('converted');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              minWidth: 150,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#fff3d6',
              color: '#7a4f01',
              cursor: 'pointer',
              outline: currentTab === 'converted' ? '3px solid #7a4f01' : 'none',
              transform: currentTab === 'converted' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">{data?.filter((row) => row.status === 'converted').length || 0}</Typography>
            <Typography variant="subtitle2">Converted</Typography>
          </Card>
        </Box>
      </Container>

      {toggleContainer === true && toggleContainerType === 'preview' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Preview Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(false);
                setAutoOpenLogModal(false);
              }}
            >
              Back
            </Button>
          </Stack>
          <PreviewLead
            setToggleContainer={setToggleContainer}
            setToggleContainerType={setToggleContainerType}
            id={openId}
            autoOpenLogModal={autoOpenLogModal}
            fetchData={fetchData}
            setNotify={setNotify}
          />
        </Container>
      )}

      {toggleContainer === true && toggleContainerType === 'update' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Update Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(false);
                setToggleContainerType('');
              }}
            >
              Back
            </Button>
          </Stack>
          <UpdateLead
            setToggleContainer={setToggleContainer}
            setToggleContainerType={setToggleContainerType}
            fetchData={fetchData}
            setNotify={setNotify}
            id={openId}
          />
        </Container>
      )}

      {/* Assign Executive Modal */}
      <Modal open={openAssignModal} onClose={() => setOpenAssignModal(false)}>
        <Box sx={style}>
          <Typography variant="h6" gutterBottom sx={{ color: '#8A1B9F', fontWeight: 'bold' }}>
            Assign Branch & Executive
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Assign this approved lead to a branch executive.
          </Typography>

          <Stack spacing={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Select Branch</InputLabel>
              <Select value={selectedBranchId} label="Select Branch" onChange={handleBranchChange}>
                {branches.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!selectedBranchId || loadingExecutives}>
              <InputLabel>{loadingExecutives ? 'Loading executives...' : 'Select Executive'}</InputLabel>
              <Select
                value={selectedExecutiveId}
                label={loadingExecutives ? 'Loading executives...' : 'Select Executive'}
                onChange={(e) => setSelectedExecutiveId(e.target.value)}
              >
                {branchExecutives.length === 0 && !loadingExecutives ? (
                  <MenuItem disabled value="">
                    No executives found in this branch
                  </MenuItem>
                ) : (
                  branchExecutives.map((exec) => (
                    <MenuItem key={exec._id} value={exec._id}>
                      {exec.name} ({exec.designation || 'Executive'})
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 4 }}>
            <Button variant="outlined" onClick={() => setOpenAssignModal(false)} disabled={assigning}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleAssignSubmit}
              disabled={assigning || !selectedBranchId || !selectedExecutiveId}
              sx={{
                bgcolor: '#8A1B9F',
                color: '#ffffff !important',
                fontWeight: 600,
                px: 2.5,
                '&:hover': { bgcolor: '#731485' },
                '&.Mui-disabled': {
                  bgcolor: 'rgba(138, 27, 159, 0.45)',
                  color: 'rgba(255, 255, 255, 0.8) !important',
                },
              }}
            >
              {assigning ? 'Assigning...' : 'Assign Executive'}
            </Button>
          </Stack>
        </Box>
      </Modal>

      {/* Reject Lead Dialog */}
      <Dialog
        open={openRejectModal}
        onClose={handleCloseRejectModal}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
          <Iconify icon="eva:alert-circle-fill" sx={{ width: 24, height: 24 }} />
          Reject Lead
        </DialogTitle>
        <DialogContent dividers>
          {rejectingLead && (
            <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#fbfbfb', border: '1px solid #eee', borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {rejectingLead.name} ({global.maskPhoneNumber(rejectingLead.mobile)})
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Category: <b>{rejectingLead.category || '-'}</b> | Type: <b>{rejectingLead.type || '-'}</b> | Weight: <b>{rejectingLead.weight ? `${rejectingLead.weight} gm` : '-'}</b>
              </Typography>
            </Box>
          )}
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500, color: 'text.primary' }}>
            Enter Rejection Reason / Remarks <span style={{ color: '#d32f2f' }}>*</span>
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            autoFocus
            placeholder="Please enter the reason for rejecting this lead (e.g., unreachable, out of branch range, cancelled by customer)..."
            value={rejectComment}
            onChange={(e) => {
              setRejectComment(e.target.value);
              if (e.target.value.trim()) setRejectError(false);
            }}
            error={rejectError}
            helperText={rejectError ? 'Please enter a comment/reason before rejecting' : ''}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseRejectModal} color="inherit" disabled={submittingReject}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmReject}
            disabled={submittingReject}
            startIcon={submittingReject ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="eva:close-circle-fill" />}
          >
            {submittingReject ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            p: 1,
            width: 140,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75,
            },
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setOpen(null);
            setToggleContainer(true);
            setToggleContainerType('preview');
          }}
        >
          <Iconify icon={'eva:eye-fill'} sx={{ mr: 2 }} />
          Preview
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpen(null);
            setToggleContainer(true);
            setToggleContainerType('update');
          }}
        >
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            const row = data.find((r) => r._id === openId);
            if (row) handleOpenAssignModal(row);
            handleCloseMenu();
          }}
        >
          <Iconify icon={'eva:person-done-fill'} sx={{ mr: 2 }} />
          Assign
        </MenuItem>
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setDeleteType('single');
            handleOpenDeleteModal();
          }}
        >
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      <Modal open={openDeleteModal} onClose={handleCloseDeleteModal}>
        <Box sx={style}>
          <Typography variant="h6">Delete</Typography>
          <Typography sx={{ mt: 3 }}>Are you sure you want to delete this lead?</Typography>
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={deleteType === 'single' ? handleDelete : handleDeleteSelected}>
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      <AddCallLogModal
        open={autoOpenLogModal}
        onClose={() => setAutoOpenLogModal(false)}
        leadId={openId}
        onSuccess={() => fetchData()}
      />

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
