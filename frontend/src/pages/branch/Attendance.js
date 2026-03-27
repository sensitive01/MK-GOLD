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
    TablePagination,
    TableRow,
    Tabs,
    Tab,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
// components
import { CreateAttendance } from '../../components/branch/attendance';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { AttendanceListHead, AttendanceListToolbar } from '../../sections/@dashboard/attendance';
// mock
import { deleteAttendanceById, getAttendance, getBranchAttendanceStats, updateAttendance } from '../../apis/branch/attendance';
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
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [logoutId, setLogoutId] = useState(null);
  const [deleteType, setDeleteType] = useState('single');
  const [currentTab, setCurrentTab] = useState('all_attendance');
  
  const userType = auth.user.userType?.toLowerCase();
  const isManager = ['branch', 'assistant_branch_manager'].includes(userType);
  const isHRAdmin = ['hr', 'admin'].includes(userType);

  const handleLogout = (id) => {
    setLogoutId(id);
    setOpenLogoutModal(true);
  };

  const confirmLogout = () => {
    updateAttendance(logoutId, { logoutTime: new Date() }).then(() => {
      fetchData();
      setOpenLogoutModal(false);
      setNotify({
        open: true,
        message: 'Logout marked successfully!',
        severity: 'success',
      });
    });
  };

  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (query = {}) => {
      if (currentTab === 'my_attendance') {
        query.employee = auth.user.employee?._id || auth.user.employee;
      } else {
        query.createdAt = {
          $gte: moment()?.format("YYYY-MM-DD"),
          $lte: moment()?.format("YYYY-MM-DD"),
        };
      }
      
      getAttendance(query).then((data) => {
        setData(data.data || []);
        setOpenBackdrop(false);
      });
      getBranchAttendanceStats().then((data) => {
        if (data.status) {
          setStats(data.data);
        }
      });
    },
    [currentTab, auth.user.employee]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, toggleContainer, currentTab]);

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
    });
  };

  const handleDeleteSelected = () => {
    deleteAttendanceById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Attendance deleted',
        severity: 'success',
      });
    });
  };

  const TABLE_HEAD = [
    ...(currentTab === 'all_attendance' ? [
        { id: 'employeeId', label: 'Employee Id', alignRight: false },
        { id: 'employeeName', label: 'Employee Name', alignRight: false },
    ] : []),
    { id: 'attendance', label: 'Photo', alignRight: false },
    { id: 'loginTime', label: 'Login Time', alignRight: false },
    { id: 'logoutTime', label: 'Logout Time', alignRight: false },
    { id: '' },
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

  return (
    <>
      <Helmet>
        <title> Attendance | MK Gold </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={notify.open}
        onClose={() => {
          setNotify({ ...notify, open: false });
        }}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => {
            setNotify({ ...notify, open: false });
          }}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
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

        <Box sx={{ mb: 3 }}>
          <Tabs
            value={currentTab}
            onChange={(event, newValue) => setCurrentTab(newValue)}
            sx={{
              '& .MuiTab-root': { color: 'white', opacity: 0.7 },
              '& .Mui-selected': { color: 'white !important', opacity: 1 },
              '& .MuiTabs-indicator': { backgroundColor: 'white' },
            }}
          >
            {(isManager || isHRAdmin) && <Tab value="all_attendance" label="All Attendance" />}
            <Tab value="my_attendance" label="My Attendance" />
          </Tabs>
        </Box>

        <Grid container spacing={3} mb={5}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">
                {currentTab === 'my_attendance' ? 'Current Month Attendance' : 'Total Employees'}
              </Typography>
              <Typography variant="h4">{stats?.total || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
              <Typography variant="h6">Present Today</Typography>
              <Typography variant="h4">{stats?.present || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
              <Typography variant="h6">Absent Today</Typography>
              <Typography variant="h4">{stats?.absent || 0}</Typography>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <AttendanceListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <AttendanceListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data?.length || 0}
                  numSelected={selected?.length}
                  onRequestSort={handleRequestSort}
                  onSelectAllClick={handleSelectAllClick}
                />
                <TableBody>
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                    const { _id, employee, attendance, createdAt, loginTime, logoutTime } = row;
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
                            <img
                              key={attendance._id ?? _id}
                              src={attendance?.uploadedFile?.startsWith('http') ? attendance.uploadedFile : `${global.baseURL}/${attendance?.uploadedFile}`}
                              alt="attendance"
                              style={{ width: '80px' }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </TableCell>
                        <TableCell align="left">{moment(loginTime || createdAt).format('DD-MM-YYYY HH:mm:ss')}</TableCell>
                        <TableCell align="left">
                          {logoutTime ? (
                            moment(logoutTime).format('DD-MM-YYYY HH:mm:ss')
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleLogout(_id)}
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
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
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
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No data in table</Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>

                {filteredData?.length > 0 && isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" paragraph>Not found</Typography>
                          <Typography variant="body2">
                            No results found for &nbsp;
                            <strong>&quot;{filterName}&quot;</strong>.
                            <br /> Try checking for typos or using complete words.
                          </Typography>
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
        </Card>
      </Container>

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

          <CreateAttendance setToggleContainer={setToggleContainer} id={openId} setNotify={setNotify} />
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
            p: 1, width: 140,
            '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 },
          },
        }}
      >
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setOpen(null);
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
          <Typography variant="h6">Delete Confirmation</Typography>
          <Typography sx={{ mt: 3 }}>Do you want to delete this record?</Typography>
          <Stack direction="row" spacing={2} mt={3}>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteType === 'single') handleDelete();
                else handleDeleteSelected();
              }}
            >
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>Close</Button>
          </Stack>
        </Box>
      </Modal>

      <Modal open={openLogoutModal} onClose={() => setOpenLogoutModal(false)}>
        <Box sx={style}>
          <Typography variant="h6">Logout Confirmation</Typography>
          <Typography sx={{ mt: 3 }}>Are you sure you want to mark logout?</Typography>
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={confirmLogout}>Logout</Button>
            <Button variant="contained" onClick={() => setOpenLogoutModal(false)}>Cancel</Button>
          </Stack>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
