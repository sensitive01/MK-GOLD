import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
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
    Typography,
    Grid,
    FormControl,
    InputLabel,
    Select,
} from '@mui/material';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import { CreateCustomer, CustomerDetail } from '../../components/branch/customer';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
// sections
import { CustomerListHead, CustomerListToolbar } from '../../sections/@dashboard/customer';
// mock
import { deleteCustomerById, findCustomer } from '../../apis/branch/customer';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'email', label: 'Email', alignRight: false },
  { id: 'phoneNumber', label: 'Phone', alignRight: false },
  { id: 'gender', label: 'Gender', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: '' },
];

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
    return filter(array, (row) => row.name.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Customer({ isTab = false }) {
  const Wrapper = isTab ? Box : Container;
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [filterOpen, setFilterOpen] = useState(false);

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.mixed().nullable(),
    toDate: Yup.mixed().nullable(),
  });

  const { handleSubmit, handleBlur, handleChange, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      const query = { branch: auth.user?.branch?._id || auth.user?.branch };
      
      if (values.fromDate || values.toDate) {
        query.createdAt = {};
        if (values.fromDate) query.createdAt.$gte = values.fromDate.format("YYYY-MM-DD");
        if (values.toDate) query.createdAt.$lte = values.toDate.format("YYYY-MM-DD");
      }
      
      fetchData(query);
      setFilterOpen(false);
    },
  });

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const fetchData = useCallback(
    (
      query = {
        createdAt: {
          $gte: moment()?.format("YYYY-MM-DD"),
          $lte: moment()?.format("YYYY-MM-DD"),
        },
      }
    ) => {
      if (!query.branch) query.branch = branch?._id || branch;
      findCustomer(query).then((data) => {
        setData(Array.isArray(data?.data) ? data.data : []);
        setOpenBackdrop(false);
      });
    },
    [branch?._id || branch]
  );

  useEffect(() => {
    setBranch(auth.user.branch);
    fetchData({
      createdAt: {
        $gte: moment()?.format("YYYY-MM-DD"),
        $lte: moment()?.format("YYYY-MM-DD"),
      },
      branch: auth.user?.branch?._id || auth.user?.branch,
    });
  }, [auth.user.branch, fetchData, toggleContainer]);

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
    deleteCustomerById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteCustomerById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Customer deleted',
        severity: 'success',
      });
    });
  };

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
        <title> Customer | MK Gold </title>
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

      <Wrapper {...(!isTab ? { maxWidth: 'xl' } : {})} sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Customer
          </Typography>
          <Stack direction="row" spacing={2}>
            {(values.fromDate || values.toDate) && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
                onClick={() => {
                  setFilterOpen(false);
                  resetForm();
                  fetchData({
                    createdAt: {
                      $gte: moment()?.format('YYYY-MM-DD'),
                      $lte: moment()?.format('YYYY-MM-DD'),
                    },
                    branch: auth.user?.branch?._id || auth.user?.branch,
                  });
                }}
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setToggleContainer(!toggleContainer);
                setToggleContainerType('create');
              }}
            >
              New Customer
            </Button>
          </Stack>
        </Stack>

        {(values.fromDate || values.toDate) && (
          <p style={{ color: '#fff', marginBottom: '20px' }}>
            {[
              values.fromDate ? `From Date: ${values.fromDate.format('YYYY-MM-DD')}` : null,
              values.toDate ? `To Date: ${values.toDate.format('YYYY-MM-DD')}` : null,
            ].filter(Boolean).join(', ')}
          </p>
        )}

        <Card>
          <CustomerListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <CustomerListHead
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
                    const { _id, name, email, phoneNumber, gender, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow
                        hover
                        key={_id}
                        tabIndex={-1}
                        role="checkbox"
                        selected={selectedData}
                        onClick={() => {
                          setOpenId(_id);
                          setToggleContainer(true);
                          setToggleContainerType('detail');
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
                        <TableCell align="left">{sentenceCase(name ?? '')}</TableCell>
                        <TableCell align="left">{email}</TableCell>
                        <TableCell align="left">{global.maskPhoneNumber(phoneNumber)}</TableCell>
                        <TableCell align="left">{sentenceCase(gender ?? '')}</TableCell>
                        <TableCell align="left">
                          <Label
                            color={
                              (status === 'active' && 'success') || (status === 'deactive' && 'error') || 'warning'
                            }
                          >
                            {sentenceCase(status)}
                          </Label>
                        </TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
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
                      <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography paragraph>No data in table</Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>

                {filteredData?.length > 0 && isNotFound && (
                  <TableBody>
                    <TableRow>
                      <TableCell align="center" colSpan={8} sx={{ py: 3 }}>
                        <Paper
                          sx={{
                            textAlign: 'center',
                          }}
                        >
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>

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
      </Wrapper>

      {toggleContainer === true && (toggleContainerType === 'create') === true && (
        <Wrapper {...(!isTab ? { maxWidth: 'xl' } : {})}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Create Customer
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(!toggleContainer);
              }}
            >
              Back
            </Button>
          </Stack>

          <CreateCustomer setToggleContainer={setToggleContainer} setNotify={setNotify} />
        </Wrapper>
      )}

      {toggleContainer === true && (toggleContainerType === 'detail') === true && (
        <Wrapper
          {...(!isTab ? { maxWidth: 'xl' } : {})}
          sx={{ display: toggleContainer === true && toggleContainerType === 'detail' ? 'block' : 'none' }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Customer Details
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(!toggleContainer);
              }}
            >
              Back
            </Button>
          </Stack>

          <CustomerDetail id={openId} />
        </Wrapper>
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
            setOpen(null);
            setToggleContainer(!toggleContainer);
            setToggleContainerType('detail');
          }}
        >
          <Iconify icon={'carbon:view-filled'} sx={{ mr: 2 }} />
          View
        </MenuItem>
        {/* <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            setOpen(null);
            setDeleteType('single');
            handleOpenDeleteModal();
          }}
        >
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem> */}
      </Popover>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Delete
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 3 }}>
            Do you want to delete?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (deleteType === 'single') {
                  handleDelete();
                } else {
                  handleDeleteSelected();
                }
              }}
            >
              Delete
            </Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>
              Close
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Dialog open={filterOpen} onClose={handleFilterClose}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          autoComplete="off"
        >
          <DialogTitle>Filter</DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ p: 1 }}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment} error={touched.fromDate && errors.fromDate && true}>
                  <DesktopDatePicker
                    label={touched.fromDate && errors.fromDate ? errors.fromDate : 'From Date'}
                    inputFormat="MM/DD/YYYY"
                    name="fromDate"
                    value={values.fromDate}
                    onChange={(value) => {
                      setFieldValue('fromDate', value, true);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterMoment} error={touched.toDate && errors.toDate && true}>
                  <DesktopDatePicker
                    label={touched.toDate && errors.toDate ? errors.toDate : 'To Date'}
                    inputFormat="MM/DD/YYYY"
                    name="toDate"
                    value={values.toDate}
                    onChange={(value) => {
                      setFieldValue('toDate', value, true);
                    }}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                setFilterOpen(false);
                resetForm();
                fetchData({
                  createdAt: {
                    $gte: moment()?.format('YYYY-MM-DD'),
                    $lte: moment()?.format('YYYY-MM-DD'),
                  },
                  branch: auth.user?.branch?._id || auth.user?.branch,
                });
              }}
            >
              Clear
            </Button>
            <Button variant="contained" onClick={handleFilterClose}>
              Close
            </Button>
            <Button variant="contained" type="submit">
              Filter
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}





