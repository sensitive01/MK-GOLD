import { sentenceCase } from 'change-case';
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
    Divider,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
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
import { SaleDetail, SalePrint } from '../../components/admin/sales';
import CreateSale from '../../components/branch/sales/CreateSale';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import global from '../../utils/global';
import TimelineView from '../../components/TimelineView';
// sections
import { SaleListHead, SaleListToolbar } from '../../sections/@dashboard/sales';
// mock
import { getBranch } from '../../apis/admin/branch';
import { deleteSalesById, findSales, updateSales, getSalesById } from '../../apis/admin/sales';
import { createFile } from '../../apis/branch/fileupload';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'billId', label: 'Bill Id', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'customer', label: 'Customer', alignRight: false },
  { id: 'branchId', label: 'Branch Id', alignRight: false },
  { id: 'branchName', label: 'Branch Name', alignRight: false },
  { id: 'saleType', label: 'Sale Type', alignRight: false },
  { id: 'purchaseType', label: 'Ornament Type', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
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
  const [saleIdToEdit, setSaleIdToEdit] = useState(null);
  const auth = useSelector((state) => state.auth);
  const userType = auth.user?.userType;
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [data, setData] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const handleOpenLogModal = () => setOpenLogModal(true);
  const handleCloseLogModal = () => setOpenLogModal(false);
  const form = useRef();
  const [openBackdrop, setOpenBackdrop] = useState(true);

  // Form validation
  const schema = Yup.object({
    fromDate: Yup.string().nullable(),
    toDate: Yup.string().nullable(),
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
      const query = {
        branch: values.branch,
        phoneNumber: values.phoneNumber,
      };
      
      if (values.fromDate || values.toDate) {
        query.createdAt = {};
        if (values.fromDate) query.createdAt.$gte = values.fromDate.format("YYYY-MM-DD");
        if (values.toDate) query.createdAt.$lte = values.toDate.format("YYYY-MM-DD");
      }

      findSales(query).then((data) => {
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

  const handleOpenMenu = (event, id) => {
    setOpen(event.currentTarget);
    setSaleIdToEdit(id);
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
    deleteSalesById(saleIdToEdit).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== saleIdToEdit));
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


  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  return (
    <>
      <Helmet>
        <title> Billing | MK Gold </title>
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
            Billing
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

        {(values.fromDate || values.toDate || values.branch || values.phoneNumber) && (
          <p style={{ color: '#fff' }}>
            {[
              values.fromDate ? `From Date: ${moment(values.fromDate).format('YYYY-MM-DD')}` : null,
              values.toDate ? `To Date: ${moment(values.toDate).format('YYYY-MM-DD')}` : null,
              values.branch ? `Branch: ${branches?.find((e) => e._id === values.branch)?.branchName || ''}` : null,
              values.phoneNumber ? `Phone Number: ${global.maskPhoneNumber(values.phoneNumber)}` : null,
            ].filter(Boolean).join(', ')}
          </p>
        )}

        <Card>
          <SaleListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            userType={userType}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <TableContainer>
            <Table sx={{ minWidth: 800 }}>
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
                    const { _id, billId, saleType, netAmount, branch: rowBranch, purchaseType, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow
                        hover
                        key={_id}
                        tabIndex={-1}
                        role="checkbox"
                        selected={selectedData}
                        onClick={() => {
                          setSaleIdToEdit(_id);
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
                        <TableCell align="left">{billId}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="left">
                          {row.customer ? (
                            <Typography variant="subtitle2">
                              {row.customer.name}
                              <br />
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {row.customer.phoneNumber}
                              </Typography>
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="left">{rowBranch?.branchId || '-'}</TableCell>
                        <TableCell align="left">{rowBranch?.branchName || '-'}</TableCell>
                        <TableCell align="left">{sentenceCase(saleType || '')}</TableCell>
                        <TableCell align="left">{sentenceCase(purchaseType || '')}</TableCell>
                        <TableCell align="left">&#8377; {netAmount}</TableCell>
                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                          <Status 
                            status={status} 
                            _id={_id} 
                            assignee={row.assignee?._id || row.assignee}
                            fetchData={fetchData}
                            saleType={saleType}
                            assigneeCompleted={row.assigneeCompleted}
                          />
                        </TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              handleOpenMenu(e, _id);
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

        <SalePrint id={saleIdToEdit} />
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

        <SaleDetail id={saleIdToEdit} setNotify={setNotify} />
      </Container>

      <Container
        maxWidth="xl"
        sx={{ display: toggleContainer === true && toggleContainerType === 'create' ? 'block' : 'none' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Edit Sale
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

        <CreateSale setToggleContainer={setToggleContainer} id={saleIdToEdit} setNotify={setNotify} />
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
            setToggleContainerType('create');
          }}
        >
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>
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
          Process Log & Timeline
        </MenuItem>
        {global.canDelete(userType) && (
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
        )}
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

      <Dialog open={openLogModal} onClose={handleCloseLogModal} maxWidth="lg" fullWidth>
        <DialogTitle>Process Log & Timeline</DialogTitle>
        <DialogContent dividers>
          {data?.find((s) => s._id === saleIdToEdit) ? (
            (() => {
              const sale = data.find((s) => s._id === saleIdToEdit);
              return (
                <Box sx={{ minWidth: 400, py: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Current Status: <span style={{ color: sale.status === 'approved' ? 'green' : sale.status === 'rejected' ? 'red' : 'orange' }}>
                      {sentenceCase(sale.status || 'pending')}
                    </span>
                  </Typography>
                  <TimelineView timeline={sale.timeline} />
                  
                  {sale.actionLog && sale.actionLog.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                        Raw Status Logs
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
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
                    </Box>
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

function Status(props) {
  const { _id, status, assignee, fetchData, saleType, assigneeCompleted } = props;
  const auth = useSelector((state) => state.auth);
  const userType = auth.user?.userType?.toLowerCase();
  const employeeId = auth.user?.employee?._id || auth.user?.employee;

  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState('');

  // Confirmation dialog state for Admin approval/rejection
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(''); // 'approve' or 'reject'

  const handleVerify = (type) => {
    setVerifyType(type);
    setOpenVerifyModal(true);
  };

  const handleOpenConfirm = (action) => {
    setConfirmAction(action);
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirm = () => {
    setOpenConfirmDialog(false);
  };

  const handleExecuteConfirm = () => {
    const nextStatus = confirmAction === 'approve' ? 'fund transfer pending' : 'finance pending';
    updateSales(_id, { status: nextStatus }).then((res) => {
      if (res.status === false) {
        alert(res.message || 'Cannot update. Please ensure assignee has completed their verification step.');
      } else {
        fetchData();
        handleCloseConfirm();
      }
    });
  };

  let content = (
    <Label
      color={
        (status === 'completed' && 'success') ||
        (status === 'finance pending' && 'warning') ||
        (status === 'release pending' && 'warning') ||
        (status === 'admin approval pending' && 'info') ||
        (status === 'fund transfer pending' && 'warning') ||
        'error'
      }
    >
      {sentenceCase(status || '')}
    </Label>
  );

  // Finance Step
  if (status === 'finance pending') {
    if (userType === 'finance' || userType === 'accounts') {
      content = (
        <Button variant="contained" size="small" onClick={() => handleVerify('finance')}>
          Update Finance
        </Button>
      );
    } else {
      content = <Label color="warning">Finance Pending</Label>;
    }
  }

  // Assignee Step (Release Stage)
  else if (status === 'release pending') {
    if (employeeId === assignee) {
      content = (
        <Button variant="contained" size="small" onClick={() => handleVerify('assignee')}>
          Update Verification
        </Button>
      );
    } else {
      content = <Label color="warning">Release Pending</Label>;
    }
  }

  // Admin Approval Step (Legacy support)
  else if (status === 'admin approval pending') {
    content = <Label color="info">Admin Approval Pending</Label>;
  }

  // Fund Transfer Step (Legacy support)
  else if (status === 'fund transfer pending') {
    content = <Label color="warning">Fund Transfer Pending</Label>;
  }

  return (
    <>
      {content}

      <VerificationModal 
        open={openVerifyModal}
        id={_id}
        type={verifyType}
        handleClose={() => setOpenVerifyModal(false)}
        fetchData={fetchData}
        saleType={saleType}
        assigneeCompleted={assigneeCompleted}
      />
    </>
  );
}

function VerificationModal({ open, id, type, handleClose, fetchData, saleType, assigneeCompleted }) {
  const auth = useSelector((state) => state.auth);
  const userType = auth.user?.userType?.toLowerCase();
  const isAdmin = userType === 'admin';

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);

  // Admin read-only review states
  const [saleDetails, setSaleDetails] = useState(null);
  const [adminComments, setAdminComments] = useState('');

  const [ornamentValues, setOrnamentValues] = useState({
    ornamentType: '',
    quantity: '',
    grossWeight: '',
    stoneWeight: '',
    netWeight: '',
    purity: '',
    netAmount: '',
  });

  // Fetch sale details for admin read-only display
  useEffect(() => {
    if (id && open) {
      setLoading(true);
      getSalesById(id).then((res) => {
        setLoading(false);
        if (res.status) {
          setSaleDetails(res.data);
          if (res.data.ornaments) {
            setOrnaments(res.data.ornaments);
          }
        }
      });
    } else {
      setSaleDetails(null);
      setOrnaments([]);
      setAdminComments('');
      setPreview(null);
    }
  }, [id, open]);

  const schema = Yup.object({
    amount: Yup.number().required('Amount is required'),
    comments: Yup.string().required('Comments are required'),
    isCompleted: Yup.boolean(),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue } = useFormik({
    initialValues: {
      amount: '',
      comments: '',
      proof: '',
      isCompleted: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      // Strict sequence guard:
      if (type === 'assignee' && values.isCompleted && saleDetails && !saleDetails.financeCompleted) {
        alert('Cannot verify Assignee stage: Finance verification must be completed first!');
        return;
      }

      setLoading(true);
      
      const payload = {};
      if (type === 'finance') {
        payload.financeAmount = values.amount;
        payload.financeComments = values.comments;
        payload.financeProof = values.proof;
        if (values.isCompleted) {
          payload.financeCompleted = true;
          payload.financeCompletedAt = new Date();
          const isPhys = saleType === 'physical';
          payload.status = (isPhys || assigneeCompleted) ? 'completed' : 'release pending';
        }
      } else if (type === 'fund transfer') {
        payload.fundTransferAmount = values.amount;
        payload.fundTransferComments = values.comments;
        payload.fundTransferProof = values.proof;
        if (values.isCompleted) {
          payload.fundTransferCompleted = true;
          payload.fundTransferCompletedAt = new Date();
          payload.status = 'completed';
        }
      } else {
        payload.assigneeAmount = values.amount;
        payload.assigneeComments = values.comments;
        payload.assigneeProof = values.proof;
        payload.ornaments = ornaments;
        if (values.isCompleted) {
          payload.assigneeCompleted = true;
          payload.assigneeCompletedAt = new Date();
          payload.status = 'bullion pending';
          payload.bullionCompleted = false;
          payload.financeCompleted = false;
        }
      }

      updateSales(id, payload).then((data) => {
        setLoading(false);
        if (data.status) {
          handleClose();
          fetchData();
        } else {
          alert(data.message || 'Verification failed. Please ensure prior stages are approved.');
        }
      });
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadId', id);
      const res = await createFile(formData);
      if (res.status) {
        setFieldValue('proof', res.data.fileUrl || res.data.path);
      }
    }
  };

  const handleAdminAction = async (action) => {
    if (!saleDetails) return;

    // Strict sequence guard:
    if (type === 'assignee' && action === 'approve' && !saleDetails.financeCompleted) {
      alert('Cannot verify Assignee stage: Finance verification must be completed first!');
      return;
    }

    setLoading(true);
    const payload = {};

    if (type === 'finance') {
      if (action === 'approve') {
        payload.financeAmount = saleDetails.netAmount;
        payload.financeComments = adminComments || 'Approved by Admin';
        payload.financeCompleted = true;
        payload.financeCompletedAt = new Date();
        payload.status = 'release pending';
      } else {
        payload.status = 'rejected';
      }
    } else if (type === 'fund transfer') {
      if (action === 'approve') {
        payload.fundTransferAmount = saleDetails.payableAmount;
        payload.fundTransferComments = adminComments || 'Approved by Admin';
        payload.fundTransferCompleted = true;
        payload.fundTransferCompletedAt = new Date();
        payload.status = 'completed';
      } else {
        payload.status = 'admin approval pending';
      }
    } else {
      if (action === 'approve') {
        payload.assigneeAmount = saleDetails.payableAmount;
        payload.assigneeComments = adminComments || 'Approved by Admin';
        payload.assigneeCompleted = true;
        payload.assigneeCompletedAt = new Date();
        payload.status = 'admin approval pending';
      } else {
        payload.status = 'finance pending';
      }
    }

    updateSales(id, payload).then((res) => {
      setLoading(false);
      if (res.status) {
        handleClose();
        fetchData();
      }
    });
  };

  // ---------------- ADMIN VIEW ----------------
  if (isAdmin) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="xl" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8f9fa', borderBottom: '1px solid #e9ecef', py: 2 }}>
          <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            {sentenceCase(type || '')} Verification — Admin Review
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ mt: 2, p: 3 }}>
          {/* Render the full comprehensive SaleDetail component showing all customer, address, ornaments, release, and bank details! */}
          <SaleDetail id={id} setNotify={() => {}} />

          {/* Admin Review Action Notes */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Admin Review Action Notes
            </Typography>
            <TextField
              name="adminComments"
              label="Add approval or rejection remarks here..."
              multiline
              rows={3}
              fullWidth
              value={adminComments}
              onChange={(e) => setAdminComments(e.target.value)}
              placeholder="e.g., Audited and verified all details successfully."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, borderTop: '1px solid #e9ecef', bgcolor: '#f8f9fa' }}>
          <Button onClick={handleClose} color="inherit" variant="outlined" size="large">
            Cancel
          </Button>
          <LoadingButton 
            variant="contained" 
            color="error" 
            loading={loading}
            onClick={() => handleAdminAction('reject')}
            size="large"
          >
            Reject Stage
          </LoadingButton>
          <LoadingButton 
            variant="contained" 
            color="success" 
            loading={loading}
            onClick={() => handleAdminAction('approve')}
            sx={{ color: '#fff' }}
            size="large"
          >
            Verify & Approve
          </LoadingButton>
        </DialogActions>
      </Dialog>
    );
  }

  // ---------------- OTHER USERS VIEW (Form Entry) ----------------
  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{sentenceCase(type || '')} Verification</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="amount"
                label="Payment Amount"
                type="number"
                value={values.amount}
                error={touched.amount && errors.amount && true}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                multiline
                rows={3}
                value={values.comments}
                error={touched.comments && errors.comments && true}
                fullWidth
                onBlur={handleBlur}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Upload Proof/Photo</Typography>
              <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
              {preview && (
                <a
                  href={values.proof ? (values.proof.startsWith('http') ? values.proof : `${global.baseURL}/${values.proof}`) : preview}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ cursor: 'pointer' }}
                >
                  <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                </a>
              )}
            </Grid>

            {type === 'assignee' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Ornaments</Typography>
                  <Button variant="outlined" size="small" onClick={() => setShowOrnamentForm(true)}>Add Ornament</Button>
                </Stack>

                {showOrnamentForm && (
                  <Box sx={{ p: 2, bgcolor: 'background.neutral', borderRadius: 1, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Ornament Type"
                          size="small"
                          value={ornamentValues.ornamentType}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, ornamentType: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Quantity"
                          size="small"
                          type="number"
                          value={ornamentValues.quantity}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, quantity: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          label="Net Weight"
                          size="small"
                          type="number"
                          value={ornamentValues.netWeight}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, netWeight: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Button 
                          variant="contained" 
                          fullWidth 
                          onClick={() => {
                            if (ornamentValues.ornamentType && ornamentValues.netWeight) {
                              setOrnaments([...ornaments, ornamentValues]);
                              setOrnamentValues({ ornamentType: '', quantity: '', grossWeight: '', stoneWeight: '', netWeight: '', purity: '', netAmount: '' });
                              setShowOrnamentForm(false);
                            }
                          }}
                        >
                          Add
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Net Wt</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ornaments.map((orn, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{orn.ornamentType}</TableCell>
                          <TableCell>{orn.quantity}</TableCell>
                          <TableCell>{orn.netWeight}</TableCell>
                          <TableCell>
                            <IconButton color="error" size="small" onClick={() => setOrnaments(ornaments.filter((_, i) => i !== idx))}>
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  name="isCompleted"
                  checked={values.isCompleted}
                  onChange={handleChange}
                />
                <Typography variant="body2">Mark as completed (Moves to next stage)</Typography>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ color: '#fff' }}>
            Save & Update Status
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

VerificationModal.propTypes = {
  open: PropTypes.bool,
  id: PropTypes.string,
  type: PropTypes.string,
  handleClose: PropTypes.func,
  fetchData: PropTypes.func,
};






