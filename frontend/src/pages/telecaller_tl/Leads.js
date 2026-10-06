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
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import * as XLSX from 'xlsx';
import { CreateLead, UpdateLead, PreviewLead } from '../../components/branch/lead';
import AddCallLogModal from '../../components/branch/lead/AddCallLogModal';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import { AttendanceListHead } from '../../sections/@dashboard/attendance';
import LeadListToolbar from '../../sections/@dashboard/lead/LeadListToolbar';
import LeadFilterSidebar from '../../sections/@dashboard/lead/LeadFilterSidebar';
import { deleteLeadById, getLeads, bulkCreateLeads, markLeadsExclusive, tlApproveLead } from '../../apis/branch/lead';
import global from '../../utils/global';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'mobile', label: 'Mobile', alignRight: false },
  { id: 'category', label: 'Category', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'weight', label: 'Weight', alignRight: false },
  { id: 'movedDate', label: 'Moved Date', alignRight: false },
  { id: 'movedBy', label: 'Moved By (Telecaller)', alignRight: false },
  { id: 'tlStatus', label: 'TL Decision', alignRight: false },
  { id: 'remarks', label: 'Remarks', alignRight: false },
  { id: 'disposition', label: 'Status', alignRight: false },
  { id: '' },
];

function descendingComparator(a, b, orderBy) {
  let aValue = a[orderBy];
  let bValue = b[orderBy];

  if (orderBy === 'movedBy') {
    aValue = (a.movedToBusinessBy?.employee?.name || a.movedToBusinessBy?.username || a.updatedBy?.employee?.name || '').toLowerCase();
    bValue = (b.movedToBusinessBy?.employee?.name || b.movedToBusinessBy?.username || b.updatedBy?.employee?.name || '').toLowerCase();
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
        const itemDate = new Date(row.date || row.createdAt).getTime();
        if (start && end) return itemDate >= start && itemDate <= end;
        if (start) return itemDate >= start;
        if (end) return itemDate <= end;
        return true;
      });
    }
    if (filters.status && filters.status !== 'all') {
      filteredArray = filteredArray.filter((row) => row.status?.toLowerCase() === filters.status.toLowerCase());
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

  if (currentTab === 'pending_review') {
    filteredArray = filteredArray.filter(
      (row) => (!row.tlStatus || row.tlStatus === 'pending') && row.status !== 'rejected'
    );
  } else if (currentTab === 'approved') {
    filteredArray = filteredArray.filter((row) => row.tlStatus === 'approved' || row.isMovedToBullionDesk);
  } else if (currentTab === 'follow_ups') {
    filteredArray = filteredArray.filter((row) => {
      if (row.status === 'rejected' || row.status === 'converted') return false;
      if (!row.dispositions || row.dispositions.length === 0) return false;
      const lastDisp = row.dispositions[row.dispositions.length - 1].status;
      return ['Callback', 'Follow Up', 'Planning to Visit', 'Visited Branch'].includes(lastDisp);
    });
  } else if (currentTab === 'converted') {
    filteredArray = filteredArray.filter((row) => row.status === 'converted');
  } else if (currentTab === 'rejected') {
    filteredArray = filteredArray.filter((row) => row.tlStatus === 'rejected' || row.status === 'rejected');
  }

  return filteredArray;
}

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 1,
};

export default function TelecallerTLLeads({ title = "Telecaller-TL Business Leads" }) {
  const auth = useSelector((state) => state.auth);
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [visiblePhoneId, setVisiblePhoneId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('movedDate');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [autoOpenLogModal, setAutoOpenLogModal] = useState(false);
  const [data, setData] = useState([]);
  const [currentTab, setCurrentTab] = useState('all');

  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
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
    // Fetch leads that have been moved to business
    getLeads({ isMovedToBusiness: true })
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
  }, [fetchData, toggleContainer]);

  const handleApprove = async (id) => {
    try {
      setOpenBackdrop(true);
      const res = await tlApproveLead(id);
      setOpenBackdrop(false);
      if (res?.status) {
        setNotify({
          open: true,
          message: 'Lead approved and moved to Bullion Desk successfully',
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
        message: err.message || 'Something went wrong',
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
      'Moved Date': item.movedToBusinessAt ? moment(item.movedToBusinessAt).format('YYYY-MM-DD HH:mm') : moment(item.updatedAt).format('YYYY-MM-DD'),
      'Moved By (Telecaller)': item.movedToBusinessBy?.employee?.name || item.movedToBusinessBy?.username || item.updatedBy?.employee?.name || '',
      'Assigned Branch': item.branch?.branchName || '',
      Status: item.status || '',
      'Latest Remark': item.dispositions?.length > 0 ? item.dispositions[item.dispositions.length - 1].remark : item.remarks || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Business_Leads');
    XLSX.writeFile(workbook, `Telecaller_TL_Business_Leads_${moment().format('YYYYMMDD')}.xlsx`);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters, currentTab);

  return (
    <>
      <Helmet>
        <title>Telecaller-TL | Business Leads</title>
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
              Telecaller-TL Business Leads
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Leads pushed to business by telecalling executives
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
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setToggleContainer(true);
                setToggleContainerType('create');
              }}
              sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC800' } }}
            >
              New Lead
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
                          {row.movedToBusinessAt ? moment(row.movedToBusinessAt).format('YYYY-MM-DD') : moment(row.updatedAt).format('YYYY-MM-DD')}
                        </TableCell>
                        <TableCell align="left">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Iconify icon="eva:person-fill" sx={{ color: '#8A1B9F', width: 16, height: 16 }} />
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {row.movedToBusinessBy?.employee?.name ||
                                row.movedToBusinessBy?.username ||
                                row.updatedBy?.employee?.name ||
                                '-'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="left">
                          {row.tlStatus === 'approved' || row.isMovedToBullionDesk ? (
                            <Box
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.5,
                                px: 1.2,
                                py: 0.4,
                                borderRadius: 1,
                                bgcolor: 'rgba(46, 125, 50, 0.12)',
                                color: '#2e7d32',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Iconify icon="eva:checkmark-circle-2-fill" sx={{ width: 14, height: 14 }} />
                              Approved
                            </Box>
                          ) : (
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#fff !important', width: 14, height: 14 }} />}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                py: 0.4,
                                px: 1.4,
                                borderRadius: 1,
                                color: '#fff !important',
                                bgcolor: '#2e7d32',
                                boxShadow: 'none',
                                '&:hover': {
                                  bgcolor: '#1b5e20',
                                  boxShadow: 'none',
                                },
                                '& .MuiButton-startIcon': { color: '#ffffff !important' },
                                '& svg': { color: '#ffffff !important', fill: '#ffffff !important' },
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(row._id);
                              }}
                            >
                              Approve
                            </Button>
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
                      <TableCell colSpan={11} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No business leads found</Typography>
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

        {/* TL Quick Filter Cards */}
        <Box sx={{ display: 'flex', gap: 2.5, mt: 3, flexWrap: 'wrap' }}>
          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('all');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
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
            <Typography variant="subtitle2">All Business Leads</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('pending_review');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#fff7e6',
              color: '#d46b08',
              cursor: 'pointer',
              outline: currentTab === 'pending_review' ? '3px solid #d46b08' : 'none',
              transform: currentTab === 'pending_review' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter((row) => (!row.tlStatus || row.tlStatus === 'pending') && row.status !== 'rejected').length || 0}
            </Typography>
            <Typography variant="subtitle2">Pending Review</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('approved');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
              p: 2.5,
              textAlign: 'center',
              bgcolor: '#e6f7ff',
              color: '#096dd9',
              cursor: 'pointer',
              outline: currentTab === 'approved' ? '3px solid #096dd9' : 'none',
              transform: currentTab === 'approved' ? 'scale(1.03)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Typography variant="h3">
              {data?.filter((row) => row.tlStatus === 'approved' || row.isMovedToBullionDesk).length || 0}
            </Typography>
            <Typography variant="subtitle2">Approved (Bullion Desk)</Typography>
          </Card>

          <Card
            onClick={() => {
              setPage(0);
              setCurrentTab('follow_ups');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            sx={{
              flex: 1,
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
                if (row.status === 'rejected' || row.status === 'converted') return false;
                if (!row.dispositions || row.dispositions.length === 0) return false;
                const lastDisp = row.dispositions[row.dispositions.length - 1].status;
                return ['Callback', 'Follow Up', 'Planning to Visit', 'Visited Branch'].includes(lastDisp);
              }).length || 0}
            </Typography>
            <Typography variant="subtitle2">Follow Ups</Typography>
          </Card>


        </Box>
      </Container>

      {toggleContainer === true && toggleContainerType === 'preview' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Preview Business Lead
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

      {toggleContainer === true && toggleContainerType === 'create' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Create Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <CreateLead setToggleContainer={setToggleContainer} setNotify={setNotify} leadSource="telecaller_tl" />
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
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <UpdateLead setToggleContainer={setToggleContainer} setNotify={setNotify} id={openId} />
        </Container>
      )}

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
            setToggleContainer(true);
            setToggleContainerType('update');
            handleCloseMenu();
          }}
        >
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
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
