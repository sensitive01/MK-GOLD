import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
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
    TableHead,
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
import Adjustments from './Adjustments';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { AttendanceListHead, AttendanceListToolbar } from '../../sections/@dashboard/attendance';
import { getAttendance, getConsolidatedAttendance, getBranchAttendanceStats, updateAttendance } from '../../apis/accounts/attendance';
import CreateAttendance from '../../components/branch/attendance/CreateAttendance';
import global from '../../utils/global';

// ----------------------------------------------------------------------

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
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

export default function FinanceAttendance() {
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

  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [attendanceDetails, setAttendanceDetails] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, remainingDays: 0 });

  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [logoutRecord, setLogoutRecord] = useState(null);
  const [logoutTimer, setLogoutTimer] = useState(null);
  const timerIntervalRef = useRef(null);

  const handleLogout = (record) => {
    setLogoutRecord(record);
    setLogoutTimer(null);
    setOpenLogoutModal(true);
  };

  const confirmLogout = () => {
    updateAttendance(logoutRecord._id, { logoutTime: new Date() }).then(() => {
      fetchData();
      let secondsLeft = 5;
      setLogoutTimer(secondsLeft);
      const intervalId = setInterval(() => {
        secondsLeft -= 1;
        setLogoutTimer(secondsLeft);
        if (secondsLeft <= 0) {
          clearInterval(intervalId);
          setOpenLogoutModal(false);
          // if we wanted to also log the user out of the app we would dispatch(logout()) here
          // but usually this is just punching out of attendance
        }
      }, 1000);
      timerIntervalRef.current = intervalId;

      setNotify({
        open: true,
        message: 'Logout marked successfully!',
        severity: 'success',
      });
    });
  };

  const handleCloseLogoutModal = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    setOpenLogoutModal(false);
    setLogoutTimer(null);
  };

  const fetchAttendanceDetails = async (employee) => {
    setModalLoading(true);
    try {
      const query = {
        employee: employee.employee?._id || employee.employeeId,
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD") || moment().startOf('month').format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD") || moment().endOf('month').format("YYYY-MM-DD"),
        }
      };
      
      const response = await getAttendance(query);
      if (response && response.data) {
        setAttendanceDetails(response.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setModalLoading(false);
    }
  };

  const openModal = async (row) => {
    setSelectedEmployee(row);
    setAttendanceSummary({
      present: row.present || 0,
      absent: row.absent || 0,
      remainingDays: (row.workingDays || 0) - ((row.present || 0) + (row.absent || 0))
    });
    setModalIsOpen(true);
    await fetchAttendanceDetails(row);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedEmployee(null);
    setAttendanceDetails([]);
  };
  
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const form = useRef();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.mixed().nullable(),
    toDate: Yup.mixed().nullable(),
  });

  const { handleSubmit, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      if (currentTab === 'payprocess') {
        setFilterOpen(false);
        return;
      }
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
      if (currentTab === 'payprocess') {
        setOpenBackdrop(false);
        return;
      }
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

  const handleClick = (event, _id) => {
    const selectedIndex = selected.indexOf(_id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, _id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected?.slice(1));
    } else if (selectedIndex === selected?.length - 1) {
      newSelected = newSelected.concat(selected?.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected?.slice(0, selectedIndex), selected?.slice(selectedIndex + 1));
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

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  const isNotFound = !filteredData?.length && !!filterName;

  const handleDelete = () => {
    deleteAttendanceById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
      setNotify({
        open: true,
        message: 'Attendance Deleted Successfully!',
        severity: 'success',
      });
    });
  };

  const handleDeleteSelected = () => {
    deleteAttendanceById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Attendance Deleted Successfully!',
        severity: 'success',
      });
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
  ];

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
  };

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  const hasMarkedAttendanceToday = data?.some(record => {
    const recordDate = moment(record.attendanceDate || record.createdAt);
    return recordDate.isSame(moment(), 'day');
  });

  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={notify.open}
        onClose={() => setNotify({ ...notify, open: false })}
        autoHideDuration={3000}
      >
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%', color: 'white' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: toggleContainer === true ? 'none' : 'block' }}>

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

        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Attendances
        </Typography>

        <Card>
          <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} aria-label="attendance tabs" variant="scrollable" scrollButtons="auto">
                <Tab value="all_attendance" label="All Attendance" />
                <Tab value="my_attendance" label="My Attendance" />
                <Tab value="consolidated_attendance" label="Consolidated" />
                <Tab value="adjustments" label="Adjustments" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 3 }}>
              {currentTab === 'adjustments' ? (
                <Adjustments />
              ) : (
                <>
                  <Button variant="contained" startIcon={<Iconify icon="material-symbols:filter-alt-off" />} onClick={() => setFilterOpen(true)} sx={{ float: 'right', mx: '10px' }}>
                    Filter
                  </Button>
              <Button variant="contained" startIcon={<Iconify icon="carbon:document-export" />} onClick={() => {
                handleExport(data?.map(e => ({ EmployeeId: e?.employee?.employeeId, EmployeeName: e?.employee?.name, Date: e.createdAt })), 'Attendance');
              }} sx={{ float: 'right' }}>
                Export
              </Button>
              {(currentTab === 'my_attendance' && !hasMarkedAttendanceToday || currentTab === 'all_attendance') && (
                <Button
                  variant="contained"
                  startIcon={<Iconify icon="eva:plus-fill" />}
                  onClick={() => {
                    setToggleContainer(!toggleContainer);
                    setToggleContainerType('create');
                  }}
                  sx={{ float: 'right', mr: '10px' }}
                >
                  Mark Attendance
                </Button>
              )}

              <p style={{ color: '#fff' }}>
                From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date: {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}
              </p>

              <AttendanceListToolbar
                numSelected={selected?.length}
                filterName={filterName}
                onFilterName={handleFilterByName}
              />

              <Scrollbar>
                <TableContainer>
                  <Table sx={{ minWidth: 800 }}>
                    <AttendanceListHead
                      order={order}
                      orderBy={orderBy}
                      headLabel={TABLE_HEAD}
                      rowCount={data?.length || 0}
                      numSelected={selected?.length}
                      onRequestSort={handleRequestSort}
                      onSelectAllClick={handleSelectAllClick}
                      hideCheckbox={true}
                    />
                    <TableBody>
                      {currentTab === 'consolidated_attendance' && filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row, index) => {
                        const { employee, present, absent, lateDays, allowances, deductions, advance, salary, payable, workingDays } = row;
                        return (
                          <TableRow hover key={index} tabIndex={-1} onClick={() => openModal(row)} sx={{ cursor: 'pointer' }}>
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
                            {false && (
                              <TableCell padding="checkbox">
                                <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                              </TableCell>
                            )}
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
                            <TableCell align="left">
                              {row.logoutTime ? (
                                moment(row.logoutTime).format('DD-MM-YYYY HH:mm:ss')
                              ) : (
                                currentTab === 'my_attendance' && employee && auth.user.employee &&
                                (employee?._id?.toString() || employee?.toString()) === (auth.user.employee?._id?.toString() || auth.user.employee?.toString()) ? (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleLogout(row)}
                                    sx={{
                                      color: 'error.main',
                                      borderColor: 'error.main',
                                      '&:hover': {
                                        bgcolor: 'rgba(255, 0, 0, 0.08)',
                                        borderColor: 'error.dark',
                                      },
                                    }}
                                  >
                                    Logout
                                  </Button>
                                ) : (
                                  'Not Logged Out'
                                )
                              )}
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
                        <TableRow>
                          <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                            <Paper sx={{ textAlign: 'center' }}>
                              <Typography variant="h6" paragraph>Not found</Typography>
                              <Typography variant="body2">No results found for <strong>&quot;{filterName}&quot;</strong>.</Typography>
                            </Paper>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    )}
                  </Table>
                </TableContainer>
              </Scrollbar>

              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={data?.length || 0}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
                </>
              )}
            </Box>
          </Box>
        </Card>
      </Box>

      <Modal open={openLogoutModal} onClose={handleCloseLogoutModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: '#fff',
          boxShadow: 24,
          p: 4,
          borderRadius: 3,
        }}>
          <Typography variant="h6" sx={{ color: '#1E293B', fontWeight: 'bold', mb: 2 }}>
            Logout Confirmation
          </Typography>
          <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 2 }} />

          {logoutRecord && (() => {
            const loginMoment = moment(logoutRecord.loginTime || logoutRecord.createdAt);
            const expectedMoment = moment(loginMoment).set({ hour: 10, minute: 0, second: 0, millisecond: 0 });
            
            let punctualText = 'On time';
            if (loginMoment.isAfter(expectedMoment)) {
              const diff = moment.duration(loginMoment.diff(expectedMoment));
              punctualText = `Late by ${diff.hours()}h ${diff.minutes()}m`;
            }

            const currentMoment = moment();
            const totalWorked = moment.duration(currentMoment.diff(loginMoment));
            const totalWorkedText = `${Math.floor(totalWorked.asHours())}h ${totalWorked.minutes()}m`;

            return (
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong style={{ color: '#1E293B' }}>Logged in at :</strong> {loginMoment.format('hh:mm A')}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong style={{ color: '#1E293B' }}>Punctual :</strong> {punctualText}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  <strong style={{ color: '#1E293B' }}>Total Duration Worked Today:</strong> {totalWorkedText}
                </Typography>
              </Stack>
            );
          })()}

          <Box sx={{ borderBottom: '1px solid #E2E8F0', mb: 3 }} />

          {logoutTimer !== null ? (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <CircularProgress variant="determinate" value={(logoutTimer / 5) * 100} sx={{ color: 'success.main', mb: 1 }} />
              <Typography variant="body2" sx={{ color: 'success.main' }}>
                Logout successful. Closing in {logoutTimer}s...
              </Typography>
            </Box>
          ) : (
            <>
              <Typography sx={{ color: '#475569', mb: 3 }}>
                Are you sure you want to logout?
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={confirmLogout}
                  sx={{ 
                    bgcolor: '#FF4842', 
                    color: '#fff', 
                    '&:hover': { bgcolor: '#B72136' },
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Logout
                </Button>
                <Button 
                  variant="contained" 
                  onClick={handleCloseLogoutModal} 
                  sx={{ 
                    bgcolor: '#FFC107', 
                    color: '#1E293B', 
                    '&:hover': { bgcolor: '#B78103' },
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </Button>
              </Stack>
            </>
          )}
        </Box>
      </Modal>

      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)}>
        <form ref={form} onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }} autoComplete="off">
          <DialogTitle>Filter</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ p: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DesktopDatePicker
                      label="From Date"
                      inputFormat="MM/DD/YYYY"
                      value={values.fromDate}
                      onChange={(v) => setFieldValue('fromDate', v)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
                  <LocalizationProvider dateAdapter={AdapterMoment}>
                    <DesktopDatePicker
                      label="To Date"
                      inputFormat="MM/DD/YYYY"
                      value={values.toDate}
                      onChange={(v) => setFieldValue('toDate', v)}
                      renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button variant="contained" color="error" onClick={() => { setFilterOpen(false); resetForm(); fetchData({ createdAt: { $gte: moment().format("YYYY-MM-DD"), $lte: moment().format("YYYY-MM-DD") } }); }}>Clear</Button>
            <Button variant="contained" onClick={() => setFilterOpen(false)}>Close</Button>
            <Button variant="contained" type="submit">Filter</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={modalIsOpen} onClose={closeModal} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="span">
            Attendance Details for {selectedEmployee?.employee?.name}
            {values.fromDate ? ` (${moment(values.fromDate).format('MMMM YYYY')})` : ` (${moment().format('MMMM YYYY')})`}
          </Typography>
          <IconButton onClick={closeModal}><Iconify icon="eva:close-fill" /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ bgcolor: 'primary.lighter', p: 2, mb: 3, borderRadius: 1 }}>
            <Grid container spacing={2} textAlign="center">
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Total Days</Typography>
                <Typography variant="h6" color="primary.main">{selectedEmployee?.workingDays || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Present</Typography>
                <Typography variant="h6" color="success.main">{attendanceSummary.present}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Absent</Typography>
                <Typography variant="h6" color="error.main">{selectedEmployee?.absent || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Remaining Days</Typography>
                <Typography variant="h6" color="warning.main">{attendanceSummary.remainingDays > 0 ? attendanceSummary.remainingDays : 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Late Days</Typography>
                <Typography variant="h6">{selectedEmployee?.lateDays || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Allowances</Typography>
                <Typography variant="h6" color="success.main">₹{selectedEmployee?.allowances || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Deductions</Typography>
                <Typography variant="h6" color="error.main">₹{selectedEmployee?.deductions || 0}</Typography>
              </Grid>
              <Grid item xs={3}>
                <Typography variant="body2" color="textSecondary">Advance</Typography>
                <Typography variant="h6" color="warning.main">₹{selectedEmployee?.advance || 0}</Typography>
              </Grid>
            </Grid>
          </Box>

          {modalLoading ? (
            <Box display="flex" justifyContent="center" my={5}><CircularProgress /></Box>
          ) : attendanceDetails.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Day</TableCell>
                    <TableCell>Login Time</TableCell>
                    <TableCell>Logout Time</TableCell>
                    <TableCell>Working Hours</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {attendanceDetails.map((record, idx) => {
                    let workingHours = "N/A";
                    const loginTime = record.loginTime || record.createdAt;
                    if (loginTime && record.logoutTime) {
                      const diffMs = moment(record.logoutTime).diff(moment(loginTime));
                      const diffHrs = Math.floor(moment.duration(diffMs).asHours());
                      const diffMins = moment.duration(diffMs).minutes();
                      workingHours = `${diffHrs}h ${diffMins}m`;
                    }
                    return (
                      <TableRow key={idx}>
                        <TableCell>{moment(record.attendanceDate || record.createdAt).format('DD/MM/YYYY')}</TableCell>
                        <TableCell>{moment(record.attendanceDate || record.createdAt).format('dddd')}</TableCell>
                        <TableCell>{loginTime ? moment(loginTime).format('hh:mm A') : "N/A"}</TableCell>
                        <TableCell>{record.logoutTime ? moment(record.logoutTime).format('hh:mm A') : "N/A"}</TableCell>
                        <TableCell>{workingHours}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography textAlign="center" py={5} color="textSecondary">No attendance records found for this period.</Typography>
          )}
        </DialogContent>
      </Dialog>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

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

