import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
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
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Paper,
    Popover,
    Select,
    Snackbar,
    Stack,
    Table,
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as FileSaver from 'file-saver';
import { useFormik } from 'formik';
import moment from 'moment';
import * as XLSX from 'xlsx';
import * as Yup from 'yup';
import PropTypes from 'prop-types';
// components
import { SaleDetail, SalePrint } from '../../components/accounts/sales';
import global from '../../utils/global';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { SaleListHead, SaleListToolbar } from '../../sections/@dashboard/sales';
// mock
import { getBranch } from '../../apis/accounts/branch';
import { deleteSalesById, findSales, updateSales } from '../../apis/accounts/sales';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'billId', label: 'Bill Id', alignRight: false },
  { id: 'saleType', label: 'Sale Type', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'branch', label: 'Branch Id', alignRight: false },
  { id: 'branch', label: 'Branch Name', alignRight: false },
  { id: 'purchaseType', label: 'Ornament Type', alignRight: false },
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
    return filter(array, (row) => row.customer?.phoneNumber.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Sale() {
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(null);
  const [filterOpen, setFilterOpen] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [openLogModal, setOpenLogModal] = useState(false);
  const handleOpenLogModal = () => setOpenLogModal(true);
  const handleCloseLogModal = () => setOpenLogModal(false);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [data, setData] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const form = useRef();
  const [openBackdrop, setOpenBackdrop] = useState(true);

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.string().required('From date is required'),
    toDate: Yup.string().required('To date is required'),
  });

  const { handleSubmit, handleBlur, handleChange, touched, errors, values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
      branch: '',
      phoneNumber: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setOpenBackdrop(true);
      findSales({
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        },
        branch: values.branch,
        phoneNumber: values.phoneNumber,
      }).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
      setFilterOpen(false);
    },
  });

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (
      query = {
        createdAt: {
          $gte: values.fromDate ?? moment()?.format("YYYY-MM-DD"),
          $lte: values.toDate ?? moment()?.format("YYYY-MM-DD"),
        },
      }
    ) => {
      findSales(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [values.fromDate, values.toDate]
  );

  useEffect(() => {
    getBranch().then((data) => {
      setBranches(data.data);
    });
    fetchData();
  }, [toggleContainer, fetchData]);

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
    deleteSalesById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteSalesById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Sale deleted',
        severity: 'success',
      });
    });
  };

  const handleExport = (fileData, fileName) => {
    const ws = XLSX.utils.json_to_sheet(fileData);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });
    FileSaver.saveAs(data, `${fileName}.xlsx`);
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

  function Status(props) {
    const userType = useSelector((state) => state.auth.user?.userType?.toLowerCase());
    const isPrivileged = userType === 'admin' || userType === 'subadmin';

    if (props.status !== 'pending') {
      return (
        <Stack direction="column" spacing={0.5}>
          <Label
            color={(props.status === 'approved' && 'success') || (props.status === 'rejected' && 'error') || 'warning'}
          >
            {sentenceCase(props.status)}
          </Label>

          {isPrivileged && (
            <Button
              size="small"
              color="inherit"
              variant="outlined"
              sx={{ fontSize: '0.65rem', py: 0 }}
              onClick={() => {
                updateSales(props._id, { status: 'pending' }).then(() => fetchData());
              }}
            >
              Revoke
            </Button>
          )}
        </Stack>
      );
    }

    return (
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
          sx={{
            bgcolor: 'success.main',
            '&:hover': {
              bgcolor: 'success.dark',
            },
          }}
          onClick={() => {
            updateSales(props._id, { status: 'approved' }).then(() => {
              fetchData();
            });
          }}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          size="small"
          color="error"
          startIcon={<Iconify icon="eva:close-circle-fill" />}
          onClick={() => {
            updateSales(props._id, { status: 'rejected' }).then(() => {
              fetchData();
            });
          }}
        >
          Reject
        </Button>
      </Stack>
    );
  }

  Status.propTypes = {
    _id: PropTypes.string,
    status: PropTypes.any,
    actionBy: PropTypes.any,
    actionAt: PropTypes.any,
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  return (
    <>
      <Helmet>
        <title> Sale | MK Gold </title>
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

      <Container maxWidth={false} sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Sale
          </Typography>
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="carbon:document-export" />}
              onClick={() => {
                handleExport(
                  data?.map((e) => {
                    console.log(e);
                    return {
                      BillId: e.billId,
                      SaleType: e.saleType,
                      NetAmount: e.netAmount,
                      BranchId: e.branch?.branchId,
                      BranchName: e.branch?.branchName,
                      OrnamentType: e.purchaseType,
                      status: e.status,
                    };
                  }),
                  'Sales'
                );
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <p style={{ color: '#fff' }}>
          From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : ''}, To Date:{' '}
          {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : ''}, Branch:{' '}
          {branches?.find((e) => e._id === values.branch)?.branchName}, Phone Number: {global.maskPhoneNumber(values.phoneNumber)}
        </p>

        <Card>
          <SaleListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <TableContainer sx={{ minWidth: 800 }}>
            <Table>
              <SaleListHead
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
                    const { _id, billId, saleType, netAmount, branch, purchaseType, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                        </TableCell>
                        <TableCell align="left">{billId}</TableCell>
                        <TableCell align="left">{sentenceCase(saleType)}</TableCell>
                        <TableCell align="left">&#8377; {netAmount}</TableCell>
                        <TableCell align="left">{branch?.branchId}</TableCell>
                        <TableCell align="left">{branch?.branchName}</TableCell>
                        <TableCell align="left">{sentenceCase(purchaseType)}</TableCell>
                        <TableCell align="left">
                          <Status status={status} _id={_id} actionBy={row.actionBy} actionAt={row.actionAt} />
                        </TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
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
                      <TableCell colSpan={9} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={9} sx={{ py: 3 }}>
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
                      <TableCell align="center" colSpan={9} sx={{ py: 3 }}>
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

      <Container
        maxWidth="xl"
        sx={{ display: toggleContainer === true && toggleContainerType === 'print' ? 'block' : 'none' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Invoice
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

        <SalePrint id={openId} />
      </Container>

      <Container
        maxWidth="xl"
        sx={{ display: toggleContainer === true && toggleContainerType === 'detail' ? 'block' : 'none' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Sale Details
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

        <SaleDetail id={openId} setNotify={setNotify} />
      </Container>

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
        <MenuItem
          onClick={() => {
            setOpen(null);
            setToggleContainer(!toggleContainer);
            setToggleContainerType('print');
          }}
        >
          <Iconify icon={'material-symbols:print'} sx={{ mr: 2 }} />
          Print
        </MenuItem>
        <MenuItem
          onClick={() => {
            setOpen(null);
            handleOpenLogModal();
          }}
        >
          <Iconify icon={'material-symbols:history'} sx={{ mr: 2 }} />
          Approval Log
        </MenuItem>
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
            Do you want branchId delete?
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

      <Dialog open={filterOpen} onClose={handleFilterClose}>
        <form
          ref={form}
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
                <FormControl fullWidth error={touched.branch && errors.branch && true}>
                  <InputLabel id="select-label">Select branch</InputLabel>
                  <Select
                    labelId="select-label"
                    id="select"
                    label={touched.branch && errors.branch ? errors.branch : 'Select branch'}
                    name="branch"
                    value={values.branch}
                    onBlur={handleBlur}
                    onChange={handleChange}
                  >
                    {branches?.map((e) => (
                      <MenuItem key={e._id} value={e._id}>
                        {e.branchId} {e.branchName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phoneNumber"
                  type="number"
                  value={values.phoneNumber}
                  error={touched.phoneNumber && errors.phoneNumber && true}
                  label={touched.phoneNumber && errors.phoneNumber ? errors.phoneNumber : 'Phone Number'}
                  fullWidth
                  onBlur={handleBlur}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
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
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl sx={{ minWidth: 120 }}>
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
                </FormControl>
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
                    $gte: moment()?.format("YYYY-MM-DD"),
                    $lte: moment()?.format("YYYY-MM-DD"),
                  },
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

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Dialog open={openLogModal} onClose={handleCloseLogModal}>
        <DialogTitle>Approval Log</DialogTitle>
        <DialogContent dividers>
          {data?.find((s) => s._id === openId) ? (
            (() => {
              const sale = data.find((s) => s._id === openId);
              return (
                <Box sx={{ minWidth: 400, py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Status: <span style={{ color: sale.status === 'approved' ? 'green' : sale.status === 'rejected' ? 'red' : 'orange' }}>
                      {sentenceCase(sale.status || 'pending')}
                    </span>
                  </Typography>
                  {sale.actionLog && sale.actionLog.length > 0 ? (
                    <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee', mt: 2 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell><strong>Employee ID</strong></TableCell>
                            <TableCell><strong>Name</strong></TableCell>
                            <TableCell><strong>Action</strong></TableCell>
                            <TableCell><strong>Timestamp</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {sale.actionLog.map((log, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{log.performerName?.employeeId || 'N/A'}</TableCell>
                              <TableCell>{log.performerName?.name || 'System'}</TableCell>
                              <TableCell sx={{ color: log.action === 'approved' ? 'green' : log.action === 'rejected' ? 'red' : 'orange', fontWeight: 'bold', textTransform: 'capitalize' }}>
                                {log.action}
                              </TableCell>
                              <TableCell>{moment(log.performedAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}>
                      No action history available for this record.
                    </Typography>
                  )}
                </Box>
              );
            })()
          ) : (
            <Typography>Loading...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseLogModal}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}





