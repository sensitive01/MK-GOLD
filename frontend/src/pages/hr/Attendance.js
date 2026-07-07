import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
// @mui
import {
    Backdrop,
    Box,
    Button,
    Card,
    Checkbox,
    CircularProgress,
    Container,
    FormControl,
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
    TablePagination,
    TableRow,
    Tabs,
    Tab,
    TextField,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as FileSaver from 'file-saver';
import { useFormik } from 'formik';
import moment from 'moment';
import * as XLSX from 'xlsx';
import * as Yup from 'yup';
// components
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { AttendanceListHead, AttendanceListToolbar } from '../../sections/@dashboard/attendance';
// mock
import { deleteAttendanceById, getAttendance, getConsolidatedAttendance } from '../../apis/hr/attendance';
import { getBranchAttendanceStats } from '../../apis/branch/attendance';
import CreateAttendance from '../../components/branch/attendance/CreateAttendance';
import global from '../../utils/global';

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function applySortFilter(array, comparator, query) {
  const stabilizedThis = array?.map((el, index) => [el, index]) || [];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });
  if (query) {
    return filter(array || [], (row) => row?.employee?.name?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Attendance() {
  const auth = useSelector((state) => state.auth);
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const [currentTab, setCurrentTab] = useState('all_attendance');
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const form = useRef();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const schema = Yup.object({
    fromDate: Yup.string().required('From date is required'),
    toDate: Yup.string().required('To date is required'),
  });

  const { handleSubmit, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: { fromDate: null, toDate: null },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      const query = {
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        },
      };
      if (currentTab === 'my_attendance') {
        const empId = auth.user.employee?._id || auth.user.employee;
        if (!empId) {
          setData([]);
          setOpenBackdrop(false);
          setFilterOpen(false);
          return;
        }
        query.employee = empId;
      }
      if (currentTab === 'consolidated_attendance') {
        getConsolidatedAttendance({ date: values.fromDate?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD') }).then((res) => {
          setData(res.data || []);
          setOpenBackdrop(false);
        });
      } else {
        getAttendance(query).then((data) => {
          setData(data.data || []);
          setOpenBackdrop(false);
        });
      }
      setFilterOpen(false);
    },
  });

  const fetchData = useCallback(
    (query = {}) => {
      if (currentTab === 'my_attendance') {
        const empId = auth.user.employee?._id || auth.user.employee;
        if (!empId) {
          setData([]);
          setStats({ total: 0, present: 0, absent: 0 });
          setOpenBackdrop(false);
          return;
        }
        query.employee = empId;
        getBranchAttendanceStats(empId).then((data) => {
          if (data.status) {
            setStats(data.data);
          }
        });
      } else if (!query.createdAt) {
          query.createdAt = {
            $gte: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
            $lte: values.toDate ?? moment()?.format("YYYY-MM-DD"),
          };
      }
      if (currentTab === 'consolidated_attendance') {
        getConsolidatedAttendance({ date: values.fromDate?.format('YYYY-MM-DD') || moment().format('YYYY-MM-DD') }).then((res) => {
          setData(res.data || []);
          setOpenBackdrop(false);
        });
      } else {
        getAttendance(query).then((data) => {
          setData(data.data || []);
          setOpenBackdrop(false);
        });
      }
    },
    [currentTab, auth.user.employee, values.fromDate, values.toDate]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, toggleContainer]);

  const handleOpenMenu = (event) => setOpen(event.currentTarget);
  const handleCloseMenu = () => setOpen(null);

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

  const handleClick = (event, _id) => {
    const selectedIndex = selected.indexOf(_id);
    let newSelected = [];
    if (selectedIndex === -1) newSelected = newSelected.concat(selected, _id);
    else if (selectedIndex === 0) newSelected = newSelected.concat(selected?.slice(1));
    else if (selectedIndex === selected?.length - 1) newSelected = newSelected.concat(selected?.slice(0, -1));
    else if (selectedIndex > 0) newSelected = newSelected.concat(selected?.slice(0, selectedIndex), selected?.slice(selectedIndex + 1));
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => { setPage(0); setRowsPerPage(parseInt(event.target.value, 10)); };
  const handleFilterByName = (event) => { setPage(0); setFilterName(event.target.value); };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData?.length && !!filterName;

  const handleDelete = () => {
    deleteAttendanceById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setNotify({ open: true, message: 'Attendance Deleted Successfully!', severity: 'success' });
    });
  };

  const handleDeleteSelected = () => {
    deleteAttendanceById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({ open: true, message: 'Attendance Deleted Successfully!', severity: 'success' });
    });
  };

  const handleExport = (fileData, fileName) => {
    if (currentTab === 'consolidated_attendance') {
      const exportData = data.map(row => ({
        'Employee ID': row.employee?.employeeId,
        'Employee Name': row.employee?.name,
        'Branch Name': row.employee?.branchName,
        'Working Days': row.workingDays,
        'Present': row.present,
        'Absent': row.absent,
        'Late Days': row.lateDays,
        'Allowances': row.allowances,
        'Deductions': row.deductions,
        'Advance': row.advance,
        'Salary': row.salary,
        'Payable': row.payable
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      FileSaver.saveAs(blob, `${fileName}.xlsx`);
      return;
    }
    const ws = XLSX.utils.json_to_sheet(fileData);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    FileSaver.saveAs(blob, `${fileName}.xlsx`);
  };

  const CONSOLIDATED_TABLE_HEAD = [
    { id: 'employeeId', label: 'Employee Id', alignRight: false },
    { id: 'employeeName', label: 'Employee Name', alignRight: false },
    { id: 'branchName', label: 'Branch Name', alignRight: false },
    { id: 'workingDays', label: 'Working Days', alignRight: false },
    { id: 'present', label: 'Present', alignRight: false },
    { id: 'absent', label: 'Absent', alignRight: false },
    { id: 'lateDays', label: 'Late Days', alignRight: false },
    { id: 'allowances', label: 'Allowances', alignRight: false },
    { id: 'deductions', label: 'Deductions', alignRight: false },
    { id: 'advance', label: 'Advance', alignRight: false },
    { id: 'salary', label: 'Salary', alignRight: false },
    { id: 'payable', label: 'Payable', alignRight: false },
  ];

  const TABLE_HEAD = currentTab === 'consolidated_attendance' ? CONSOLIDATED_TABLE_HEAD : [
    ...(currentTab === 'all_attendance' ? [
        { id: 'employeeId', label: 'Employee Id', alignRight: false },
        { id: 'employeeName', label: 'Employee Name', alignRight: false },
    ] : []),
    { id: 'attendance', label: 'Photo', alignRight: false },
    { id: 'loginTime', label: 'Login Time', alignRight: false },
    { id: 'logoutTime', label: 'Logout Time', alignRight: false },
    { id: '' },
  ];

  const style = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4 };

  const Alert = forwardRef((p, r) => <MuiAlert elevation={6} ref={r} variant="filled" {...p} />);

  return (
    <>
      <Helmet><title> Attendance | MK Gold </title></Helmet>
      <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'right' }} open={notify.open} onClose={() => setNotify({ ...notify, open: false })} autoHideDuration={3000}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%', color: 'white' }}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl" sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Attendance
          </Typography>
          {currentTab === 'my_attendance' && (
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setToggleContainer(!toggleContainer);
                setToggleContainerType('create');
              }}
            >
              Mark Attendance
            </Button>
          )}
        </Stack>

        {currentTab === 'my_attendance' && (
          <Grid container spacing={3} mb={5}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
                <Typography variant="h6">Total Days (Month)</Typography>
                <Typography variant="h4">{stats?.total || 0}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
                <Typography variant="h6">Present</Typography>
                <Typography variant="h4">{stats?.present || 0}</Typography>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
                <Typography variant="h6">Absent</Typography>
                <Typography variant="h4">{stats?.absent || 0}</Typography>
              </Card>
            </Grid>
          </Grid>
        )}

        <Card>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} aria-label="attendance tabs">
                <Tab value="all_attendance" label="All Attendance" />
                <Tab value="my_attendance" label="My Attendance" />
                <Tab value="consolidated_attendance" label="Consolidated Attendance" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
              <Button variant="contained" startIcon={<Iconify icon="material-symbols:filter-alt-off" />} onClick={() => setFilterOpen(true)} sx={{ float: 'right', mx: '10px' }}>Filter</Button>
              <Button variant="contained" startIcon={<Iconify icon="carbon:document-export" />} onClick={() => handleExport(data?.map(e => ({ EmployeeId: e?.employee?.employeeId, EmployeeName: e?.employee?.name, Date: e.createdAt })), 'Attendance')} sx={{ float: 'right' }}>Export</Button>

              <p style={{ color: '#fff' }}>From Date: {values.fromDate ? values.fromDate.format('YYYY-MM-DD') : ''}, To Date: {values.toDate ? values.toDate.format('YYYY-MM-DD') : ''}</p>

              <AttendanceListToolbar numSelected={selected?.length} filterName={filterName} onFilterName={handleFilterByName} handleDelete={() => { setDeleteType('selected'); handleOpenDeleteModal(); }} />

              <Scrollbar>
                <TableContainer>
                  <Table sx={{ minWidth: 800 }}>
                    <AttendanceListHead order={order} orderBy={orderBy} headLabel={TABLE_HEAD} rowCount={data?.length || 0} numSelected={selected?.length} onRequestSort={handleRequestSort} onSelectAllClick={handleSelectAllClick} />
                    <TableBody>
                      {currentTab === 'consolidated_attendance' && filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row, index) => {
                        const { employee, present, absent, lateDays, allowances, deductions, advance, salary, payable, workingDays } = row;
                        return (
                          <TableRow hover key={index} tabIndex={-1}>
                            <TableCell padding="checkbox"></TableCell>
                            <TableCell align="left">{employee?.employeeId}</TableCell>
                            <TableCell align="left">{employee?.name}</TableCell>
                            <TableCell align="left">{employee?.branchName}</TableCell>
                            <TableCell align="left">{workingDays}</TableCell>
                            <TableCell align="left">{present}</TableCell>
                            <TableCell align="left">{absent}</TableCell>
                            <TableCell align="left">{lateDays}</TableCell>
                            <TableCell align="left">₹{allowances}</TableCell>
                            <TableCell align="left">₹{deductions}</TableCell>
                            <TableCell align="left">₹{advance}</TableCell>
                            <TableCell align="left">₹{salary}</TableCell>
                            <TableCell align="left">₹{payable}</TableCell>
                          </TableRow>
                        );
                      })}
                      {currentTab !== 'consolidated_attendance' && filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                        const { _id, employee, attendance, createdAt } = row;
                        const selectedData = selected.indexOf(_id) !== -1;
                        return (
                          <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                            </TableCell>
                            {currentTab === 'all_attendance' && (
                              <>
                                <TableCell align="left">{employee?.employeeId}</TableCell>
                                <TableCell align="left">{employee?.name}</TableCell>
                              </>
                            )}
                            <TableCell align="left">
                              {attendance?.uploadedFile ? (
                                <img src={attendance?.uploadedFile?.startsWith('http') ? attendance.uploadedFile : `${global.baseURL}/${attendance?.uploadedFile}`} alt="attendance" style={{ width: '80px' }} />
                              ) : 'No Image'}
                            </TableCell>
                            <TableCell align="left">{moment(row?.loginTime || createdAt).format('DD-MM-YYYY HH:mm:ss')}</TableCell>
                            <TableCell align="left">{row.logoutTime ? moment(row.logoutTime).format('DD-MM-YYYY HH:mm:ss') : 'N/A'}</TableCell>
                            <TableCell align="right">
                              <IconButton size="large" color="inherit" onClick={(e) => { setOpenId(_id); handleOpenMenu(e); }}>
                                <Iconify icon={'eva:more-vertical-fill'} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {emptyRows > 0 && <TableRow style={{ height: 53 * emptyRows }}><TableCell colSpan={6} /></TableRow>}
                      {filteredData?.length === 0 && (
                        <TableRow><TableCell align="center" colSpan={6} sx={{ py: 3 }}><Paper sx={{ textAlign: 'center' }}><Typography paragraph>No data in table</Typography></Paper></TableCell></TableRow>
                      )}
                    </TableBody>
                    {filteredData?.length > 0 && isNotFound && (
                      <TableBody>
                        <TableRow><TableCell align="center" colSpan={6} sx={{ py: 3 }}><Paper sx={{ textAlign: 'center' }}><Typography variant="h6" paragraph>Not found</Typography></Paper></TableCell></TableRow>
                      </TableBody>
                    )}
                  </Table>
                </TableContainer>
              </Scrollbar>
              <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={data?.length || 0} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
            </Box>
          </Box>
        </Card>
      </Container>

      <Popover open={Boolean(open)} anchorEl={open} onClose={handleCloseMenu} anchorOrigin={{ vertical: 'top', horizontal: 'left' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} PaperProps={{ sx: { p: 1, width: 140, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } } }}>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { setOpen(null); setDeleteType('single'); handleOpenDeleteModal(); }}><Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} /> Delete</MenuItem>
      </Popover>

      <Modal open={openDeleteModal} onClose={handleCloseDeleteModal}><Box sx={style}><Typography variant="h6">Delete Confirmation</Typography><Typography sx={{ mt: 3 }}>Do you want to delete this record?</Typography><Stack direction="row" spacing={2} mt={3}><Button variant="contained" color="error" onClick={() => { if (deleteType === 'single') handleDelete(); else handleDeleteSelected(); }}>Delete</Button><Button variant="contained" onClick={handleCloseDeleteModal}>Close</Button></Stack></Box></Modal>

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
        <form ref={form} onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} autoComplete="off">
          <DialogTitle>Filter</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ p: 1 }}>
              <Grid item xs={12} sm={6}><FormControl sx={{ minWidth: 120 }}><LocalizationProvider dateAdapter={AdapterMoment}><DesktopDatePicker label="From Date" inputFormat="MM/DD/YYYY" value={values.fromDate} onChange={(v) => setFieldValue('fromDate', v)} renderInput={(params) => <TextField {...params} fullWidth />}/></LocalizationProvider></FormControl></Grid>
              <Grid item xs={12} sm={6}><FormControl sx={{ minWidth: 120 }}><LocalizationProvider dateAdapter={AdapterMoment}><DesktopDatePicker label="To Date" inputFormat="MM/DD/YYYY" value={values.toDate} onChange={(v) => setFieldValue('toDate', v)} renderInput={(params) => <TextField {...params} fullWidth />}/></LocalizationProvider></FormControl></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="error" onClick={() => { setFilterOpen(false); resetForm(); fetchData({ createdAt: { $gte: moment().format("YYYY-MM-DD"), $lte: moment().format("YYYY-MM-DD") } }); }}>Clear</Button>
            <Button variant="contained" onClick={() => setFilterOpen(false)}>Close</Button>
            <Button variant="contained" type="submit">Filter</Button>
          </DialogActions>
        </form>
      </Dialog>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}><CircularProgress color="inherit" /></Backdrop>

      {toggleContainer === true && toggleContainerType === 'create' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Mark Attendance
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(!toggleContainer)}
            >
              Back
            </Button>
          </Stack>

          <CreateAttendance setToggleContainer={setToggleContainer} setNotify={setNotify} />
        </Container>
      )}
    </>
  );
}

