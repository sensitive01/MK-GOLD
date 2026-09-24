import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback, useMemo } from 'react';
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
  Radio,
  RadioGroup,
  FormControlLabel,
  Tooltip,
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
import { SaleDetail, SalePrint } from '../../components/accounts/sales';
import CreateSale from '../../components/branch/sales/CreateSale';
import global from '../../utils/global';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { SaleListHead, SaleListToolbar } from '../../sections/@dashboard/sales';
// mock
import { getBranch } from '../../apis/accounts/branch';
import { deleteSalesById, findSales, updateSales, getSalesById } from '../../apis/accounts/sales';
import { createFile } from '../../apis/branch/fileupload';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'sno', label: 'S.No', alignRight: false },
  { id: 'billId', label: 'Bill Id', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'customer', label: 'Customer', alignRight: false },
  { id: 'branchName', label: 'Branch Name', alignRight: false },
  { id: 'biller', label: 'Biller', alignRight: false },
  { id: 'saleType', label: 'Sale Type', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
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
  let results = stabilizedThis?.map((el) => el[0]) || [];
  if (query && query.trim() !== '') {
    const q = query.trim().toLowerCase();
    results = filter(results, (row) => {
      const billId = String(row.billId || '').toLowerCase();
      const customerName = String(row.customer?.name || '').toLowerCase();
      const phoneNumber = String(row.customer?.phoneNumber || '').toLowerCase();
      const branchName = String(row.branch?.branchName || '').toLowerCase();
      const branchId = String(row.branch?.branchId || '').toLowerCase();
      const billerName = String(row.biller?.name || row.biller?.employeeId || '').toLowerCase();
      const saleType = String(row.saleType || '').toLowerCase();
      const status = String(row.status || '').toLowerCase();
      const netAmount = String(row.netAmount || '');

      return (
        billId.includes(q) ||
        customerName.includes(q) ||
        phoneNumber.includes(q) ||
        branchName.includes(q) ||
        branchId.includes(q) ||
        billerName.includes(q) ||
        saleType.includes(q) ||
        status.includes(q) ||
        netAmount.includes(q)
      );
    });
  }
  return results;
}

export default function Sale() {
  const auth = useSelector((state) => state.auth);
  const isAdmin = auth?.user?.userType?.toLowerCase() === 'admin';
  const [visiblePhoneId, setVisiblePhoneId] = useState(null);
  const [branches, setBranches] = useState([]);
  const [open, setOpen] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [openLogModal, setOpenLogModal] = useState(false);
  const handleOpenLogModal = () => setOpenLogModal(true);
  const handleCloseLogModal = () => setOpenLogModal(false);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [data, setData] = useState([]);
  const [detailedSale, setDetailedSale] = useState(null);
  const selectedSale = useMemo(() => data?.find((s) => s._id === openId), [data, openId]);
  const isSaleCompleted = ['completed', 'intransit', 'moved', 'melted'].includes((detailedSale?.status || selectedSale?.status)?.toLowerCase());
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const form = useRef();
  const [openBackdrop, setOpenBackdrop] = useState(true);

  // Date & Branch filter form
  const schema = Yup.object({
    fromDate: Yup.mixed().nullable(),
    toDate: Yup.mixed().nullable(),
  });

  const { values, setFieldValue, resetForm } = useFormik({
    initialValues: {
      fromDate: null,
      toDate: null,
      branch: '',
    },
    validationSchema: schema,
  });

  const handleDateChange = (field, value) => {
    setFieldValue(field, value);
    setPage(0);
    const updatedValues = { ...values, [field]: value };
    const query = {};

    const createdAt = {};
    if (updatedValues.fromDate && moment(updatedValues.fromDate).isValid()) {
      createdAt.$gte = moment(updatedValues.fromDate).format('YYYY-MM-DD');
    }
    if (updatedValues.toDate && moment(updatedValues.toDate).isValid()) {
      createdAt.$lte = moment(updatedValues.toDate).format('YYYY-MM-DD');
    }
    if (Object.keys(createdAt).length > 0) {
      query.createdAt = createdAt;
    }
    if (updatedValues.branch) query.branch = updatedValues.branch;

    setOpenBackdrop(true);
    fetchData(query);
  };

  const handleBranchChange = (value) => {
    setFieldValue('branch', value);
    setPage(0);
    const query = {};

    const createdAt = {};
    if (values.fromDate && moment(values.fromDate).isValid()) {
      createdAt.$gte = moment(values.fromDate).format('YYYY-MM-DD');
    }
    if (values.toDate && moment(values.toDate).isValid()) {
      createdAt.$lte = moment(values.toDate).format('YYYY-MM-DD');
    }
    if (Object.keys(createdAt).length > 0) {
      query.createdAt = createdAt;
    }
    if (value) query.branch = value;

    setOpenBackdrop(true);
    fetchData(query);
  };

  const handleClearFilter = () => {
    resetForm();
    setPage(0);
    setOpenBackdrop(true);
    fetchData({});
  };

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback((query = {}) => {
    findSales(query).then((data) => {
      setData(Array.isArray(data?.data) ? data.data : []);
      setOpenBackdrop(false);
    });
  }, []);

  useEffect(() => {
    getBranch().then((data) => {
      if (Array.isArray(data?.data)) {
        setBranches(data.data);
      }
    });
    fetchData({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toggleContainer]);

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
    width: { xs: '90%', sm: 400 },
    maxWidth: 400,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    p: { xs: 2.5, sm: 4 },
  };

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);




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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={{ xs: 2.5, sm: 4 }}
        >
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Billing
          </Typography>
          <Button
            variant="contained"
            size="small"
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
            sx={{ height: 40 }}
          >
            Export
          </Button>
        </Stack>

        <Card>
          <SaleListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
              {(values.fromDate || values.toDate || values.branch) && (
                <Button
                  variant="contained"
                  size="small"
                  color="error"
                  startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
                  onClick={handleClearFilter}
                  sx={{ height: 40 }}
                >
                  Clear Filter
                </Button>
              )}
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="From Date"
                  inputFormat="DD-MM-YYYY"
                  value={values.fromDate}
                  onChange={(val) => handleDateChange('fromDate', val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        shrink: true,
                        sx: {
                          color: '#637381',
                          fontWeight: 500,
                          bgcolor: '#ffffff',
                          px: 0.5,
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
                      }}
                      inputProps={{
                        ...params.inputProps,
                        placeholder: 'dd-mm-yyyy',
                      }}
                      sx={{
                        width: { xs: 140, sm: 165 },
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          color: '#212B36',
                          fontWeight: 500,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          '& fieldset': {
                            borderColor: '#cfd8dc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#90a4ae',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiSvgIcon-root, & .MuiIconButton-root': {
                          color: '#212B36',
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="To Date"
                  inputFormat="DD-MM-YYYY"
                  value={values.toDate}
                  onChange={(val) => handleDateChange('toDate', val)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      InputLabelProps={{
                        ...params.InputLabelProps,
                        shrink: true,
                        sx: {
                          color: '#637381',
                          fontWeight: 500,
                          bgcolor: '#ffffff',
                          px: 0.5,
                          '&.Mui-focused': {
                            color: 'primary.main',
                          },
                        },
                      }}
                      inputProps={{
                        ...params.inputProps,
                        placeholder: 'dd-mm-yyyy',
                      }}
                      sx={{
                        width: { xs: 140, sm: 165 },
                        '& .MuiOutlinedInput-root': {
                          height: 40,
                          color: '#212B36',
                          fontWeight: 500,
                          bgcolor: '#ffffff',
                          borderRadius: 1,
                          '& fieldset': {
                            borderColor: '#cfd8dc',
                          },
                          '&:hover fieldset': {
                            borderColor: '#90a4ae',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: 'primary.main',
                          },
                        },
                        '& .MuiSvgIcon-root, & .MuiIconButton-root': {
                          color: '#212B36',
                        },
                      }}
                    />
                  )}
                />
              </LocalizationProvider>
              <FormControl
                size="small"
                sx={{
                  minWidth: 150,
                  '& .MuiOutlinedInput-root': {
                    height: 40,
                    color: '#212B36',
                    fontWeight: 500,
                    bgcolor: '#ffffff',
                    borderRadius: 1,
                    '& fieldset': {
                      borderColor: '#cfd8dc',
                    },
                    '&:hover fieldset': {
                      borderColor: '#90a4ae',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                  '& .MuiSelect-icon': {
                    color: '#212B36',
                  },
                }}
              >
                <InputLabel
                  id="branch-select-label"
                  shrink
                  sx={{
                    color: '#637381',
                    fontWeight: 500,
                    bgcolor: '#ffffff',
                    px: 0.5,
                    '&.Mui-focused': {
                      color: 'primary.main',
                    },
                  }}
                >
                  Branch
                </InputLabel>
                <Select
                  labelId="branch-select-label"
                  id="branch-select"
                  label="Branch"
                  notched
                  name="branch"
                  value={values.branch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                >
                  <MenuItem value="">
                    <em>All Branches</em>
                  </MenuItem>
                  {branches
                    ?.filter((e) => e.isHeadOffice !== 'yes' && !e.branchName?.toLowerCase().includes('head office'))
                    ?.map((e) => (
                      <MenuItem key={e._id} value={e._id}>
                        {e.branchId} {e.branchName}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </SaleListToolbar>

          <Scrollbar sx={{ width: '100%' }}>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table sx={{ minWidth: 800 }}>
                <SaleListHead
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
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row, index) => {
                    const { _id, billId, saleType, netAmount, branch, purchaseType, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;
                    const isPledged = saleType?.toLowerCase() !== 'physical';
                    const isReleasePending = isPledged && (
                      Number(netAmount || 0) === 0 ||
                      !row.assigneeCompleted ||
                      status === 'release pending' ||
                      (Array.isArray(row.release) && row.release.length > 0 && row.release.some((r) => r.status && r.status !== 'completed'))
                    );

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
                        sx={{ ...(isReleasePending && { '& td, & td .MuiTypography-root': { color: '#8A1B9F !important', fontWeight: 'bold !important' } }) }}
                      >
                        <TableCell align="left">{page * rowsPerPage + index + 1}</TableCell>
                        <TableCell align="left">{billId}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="left">
                          {row.customer ? (
                            <Typography variant="subtitle2">
                              {row.customer.name}
                              <br />
                              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {isAdmin || visiblePhoneId === _id ? row.customer.phoneNumber : global.maskPhoneNumber(row.customer.phoneNumber)}
                                </Typography>
                                {!isAdmin && row.customer.phoneNumber && (
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setVisiblePhoneId(visiblePhoneId === _id ? null : _id);
                                    }}
                                    sx={{ ml: 0.5, p: 0.25 }}
                                  >
                                    <Iconify icon={visiblePhoneId === _id ? 'eva:eye-off-fill' : 'eva:eye-fill'} width={14} height={14} />
                                  </IconButton>
                                )}
                              </Box>
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="left">{branch?.branchName || '-'}</TableCell>
                        <TableCell align="left">
                          {row.biller ? (
                            <Typography variant="subtitle2">
                              {row.biller.name || '-'}
                              {row.biller.employeeId && (
                                <>
                                  <br />
                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    {row.biller.employeeId}
                                  </Typography>
                                </>
                              )}
                            </Typography>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="left">
                          {[sentenceCase(saleType || ''), sentenceCase(purchaseType || '')].filter(Boolean).join(' ') || '-'}
                        </TableCell>
                        <TableCell align="left">
                          {isReleasePending ? (
                            <Typography variant="body2" sx={{ color: '#8A1B9F', fontWeight: 'bold' }}>
                              Release Pending
                            </Typography>
                          ) : (
                            <>&#8377; {netAmount}</>
                          )}
                        </TableCell>
                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                          <Status
                            status={status}
                            _id={_id}
                            assignee={row.assignee?._id || row.assignee}
                            fetchData={fetchData}
                            saleType={saleType}
                            assigneeCompleted={row.assigneeCompleted}
                            isReleasePending={isReleasePending}
                            row={row}
                          />
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
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50, 100]}
            component="div"
            count={filteredData?.length || data?.length || 0}
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
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#FFD700',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: '#e6c200',
                },
              }}
              startIcon={<Iconify icon="material-symbols:print" />}
              onClick={() => {
                setToggleContainerType('print');
              }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(false);
                setDetailedSale(null);
                fetchData();
              }}
            >
              Back
            </Button>
          </Stack>
        </Stack>

        <SaleDetail
          id={openId}
          setNotify={setNotify}
          onSaleLoaded={setDetailedSale}
          onActionComplete={() => {
            fetchData();
          }}
        />
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
        {['completed', 'intransit', 'moved', 'melted'].includes(selectedSale?.status?.toLowerCase()) && (
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
        )}
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
            handleOpenLogModal();
          }}
          sx={{ display: 'none' }}
        >
          <Iconify icon={'material-symbols:history'} sx={{ mr: 2 }} />
          Approval Log
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
                            <TableCell><strong>Comments</strong></TableCell>
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
                              <TableCell>{log.comments || 'N/A'}</TableCell>
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

function Status(props) {
  const { _id, status, assignee, fetchData, saleType, assigneeCompleted, isReleasePending, row } = props;
  const auth = useSelector((state) => state.auth);
  const userType = auth.user?.userType?.toLowerCase();
  const isAdmin = userType === 'admin';
  const employeeId = auth.user?.employee?._id || auth.user?.employee;

  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState('');

  const handleVerify = (type) => {
    if (type === 'finance') {
      const isPledged = saleType?.toLowerCase() !== 'physical';
      const isReleaseFinance = isPledged && (!assigneeCompleted || isReleasePending);
      let isBankRequired = false;
      let isBankPending = false;

      if (isReleaseFinance) {
        const rels = row?.release || [];
        isBankRequired = rels.some((r) => r.paymentType === 'bank' || r.bank);
        const isRelVerified = Boolean(
          (row?.financePayments || []).some((fp) => fp.isVerified && fp.stage === 'release')
        );
        isBankPending = isBankRequired && !isRelVerified;
      } else {
        isBankRequired = row?.paymentType === 'bank' || (row?.paymentType === 'partial' && Number(row?.bankAmount) > 0);
        const targetSaleBankId = row?.bank?._id || row?.bank;
        const matchedSaleBank = (row?.customer?.bank || []).find(
          (b) =>
            (targetSaleBankId && String(b._id) === String(targetSaleBankId)) ||
            (b.accountNo && row?.bank?.accountNo && String(b.accountNo) === String(row?.bank?.accountNo))
        ) || (typeof row?.bank === 'object' && row?.bank?.accountNo ? row?.bank : null);
        const saleAcct = matchedSaleBank?.accountNo || row?.bank?.accountNo;
        const saleId = matchedSaleBank?._id || targetSaleBankId;
        const isSaleVerified = Boolean(
          (row?.financePayments || []).some(
            (fp) => fp.isVerified && (
              fp.stage === 'sale' ||
              (saleId && String(fp.bank?.bankId || fp.bank?._id) === String(saleId)) ||
              (saleAcct && fp.bank?.accountNo && String(fp.bank.accountNo) === String(saleAcct))
            )
          ) || (row?.saleType === 'physical' && row?.isBankVerified)
        );
        isBankPending = isBankRequired && !isSaleVerified;
      }

      if (isBankPending) {
        setNotify?.({
          open: true,
          message: `Bank verification required in Billing Summary before updating finance (${isReleaseFinance ? 'Release Bank' : 'Customer Sale Bank'})`,
          severity: 'warning',
        });
        return;
      }
    }

    setVerifyType(type);
    setOpenVerifyModal(true);
  };

  let content = (
    <Label
      color={
        (status === 'completed' && 'success') ||
        (status === 'finance pending' && 'warning') ||
        (status === 'release pending' && 'warning') ||
        (status === 'bullion pending' && 'warning') ||
        (status === 'admin approval pending' && 'info') ||
        (status === 'fund transfer pending' && 'warning') ||
        'error'
      }
    >
      {sentenceCase(status || '')}
    </Label>
  );

  const hasFinanceUpdatedToday = Boolean(
    status !== 'finance pending' &&
    (status === 'completed' || row?.financeCompleted || (row?.financePayments && row.financePayments.length > 0)) &&
    moment(row?.createdAt).isSame(moment(), 'day')
  );

  const canShowUpdateFinance = isAdmin;

  if (hasFinanceUpdatedToday && canShowUpdateFinance) {
    content = (
      <Stack direction="row" spacing={1} alignItems="center">
        <Label
          color={
            (status === 'completed' && 'success') ||
            (status === 'finance pending' && 'warning') ||
            (status === 'release pending' && 'warning') ||
            (status === 'bullion pending' && 'warning') ||
            (status === 'admin approval pending' && 'info') ||
            (status === 'fund transfer pending' && 'warning') ||
            'error'
          }
        >
          {sentenceCase(status || '')}
        </Label>
        {status === 'release pending' && employeeId === assignee && (
          <Button variant="contained" size="small" onClick={() => handleVerify('assignee')}>
            Update Verification
          </Button>
        )}
        <Button
          variant="contained"
          size="small"
          color="warning"
          sx={{ whiteSpace: 'nowrap', py: 0.5, px: 1, minWidth: 'auto', fontSize: '0.75rem' }}
          onClick={(e) => {
            e.stopPropagation();
            handleVerify('finance');
          }}
        >
          Update Finance
        </Button>
      </Stack>
    );
  } else if (status === 'finance pending') {
    if (isAdmin || userType === 'finance' || userType === 'accounts') {
      const isPledged = saleType?.toLowerCase() !== 'physical';
      const isReleaseFinance = isPledged && (!assigneeCompleted || isReleasePending);

      // Check if bank verification is required for the respective stage
      let isBankRequired = false;
      let isBankPendingVerification = false;

      if (isReleaseFinance) {
        const rels = row?.release || [];
        isBankRequired = rels.some((r) => r.paymentType === 'bank' || r.bank);
        const isRelVerified = Boolean(
          (row?.financePayments || []).some((fp) => fp.isVerified && fp.stage === 'release')
        );
        isBankPendingVerification = isBankRequired && !isRelVerified;
      } else {
        isBankRequired = row?.paymentType === 'bank' || (row?.paymentType === 'partial' && Number(row?.bankAmount) > 0);
        const targetSaleBankId = row?.bank?._id || row?.bank;
        const matchedSaleBank = (row?.customer?.bank || []).find(
          (b) =>
            (targetSaleBankId && String(b._id) === String(targetSaleBankId)) ||
            (b.accountNo && row?.bank?.accountNo && String(b.accountNo) === String(row?.bank?.accountNo))
        ) || (typeof row?.bank === 'object' && row?.bank?.accountNo ? row?.bank : null);
        const saleAcct = matchedSaleBank?.accountNo || row?.bank?.accountNo;
        const saleId = matchedSaleBank?._id || targetSaleBankId;
        const isSaleVerified = Boolean(
          (row?.financePayments || []).some(
            (fp) => fp.isVerified && (
              fp.stage === 'sale' ||
              (saleId && String(fp.bank?.bankId || fp.bank?._id) === String(saleId)) ||
              (saleAcct && fp.bank?.accountNo && String(fp.bank.accountNo) === String(saleAcct))
            )
          ) || (row?.saleType === 'physical' && row?.isBankVerified)
        );
        isBankPendingVerification = isBankRequired && !isSaleVerified;
      }

      if (isBankPendingVerification) {
        content = (
          <Tooltip title={`Bank verification required in Billing Summary before updating finance (${isReleaseFinance ? 'Release Bank' : 'Customer Sale Bank'})`} arrow>
            <span>
              <Button
                variant="contained"
                size="small"
                disabled
                sx={{
                  bgcolor: 'action.disabledBackground',
                  color: 'text.disabled',
                  cursor: 'not-allowed',
                }}
              >
                {isReleaseFinance ? 'Finance Pay Release' : 'Finance Update'}
              </Button>
            </span>
          </Tooltip>
        );
      } else {
        content = (
          <Button variant="contained" size="small" onClick={() => handleVerify('finance')}>
            {isReleaseFinance ? 'Finance Pay Release' : 'Finance Update'}
          </Button>
        );
      }
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
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [selectedBank, setSelectedBank] = useState(null);

  const [ornamentValues, setOrnamentValues] = useState({
    ornamentType: '',
    quantity: '',
    grossWeight: '',
    stoneWeight: '',
    netWeight: '',
    purity: '',
    netAmount: '',
  });

  const [fileType, setFileType] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const schema = Yup.object({
    amount: Yup.number().when([], {
      is: () => type !== 'finance' || saleDetails?.paymentType !== 'partial',
      then: (s) => s.required('Amount is required'),
      otherwise: (s) => s.nullable(),
    }),
    cashAmount: Yup.number().nullable(),
    bankAmount: Yup.number().nullable(),
    comments: Yup.string().required('Comments are required'),
    isCompleted: Yup.boolean(),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue, resetForm } = useFormik({
    initialValues: {
      amount: '',
      cashAmount: '',
      bankAmount: '',
      bankId: '',
      paymentType: '',
      comments: '',
      proof: '',
      isCompleted: false,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (type === 'finance') {
        const isPledged = (saleDetails?.saleType || saleType || '').toLowerCase() === 'pledged';
        const isPledgedStage = isPledged && !(saleDetails?.assigneeCompleted ?? assigneeCompleted);
        if (isPledgedStage) {
          const rels = saleDetails?.release || [];
          const bankRequired = rels.some((r) => r.paymentType === 'bank' || r.bank);
          const isRelVerified = Boolean(
            (saleDetails?.financePayments || []).some((fp) => fp.isVerified && fp.stage === 'release')
          );
          if (bankRequired && !isRelVerified) {
            alert('Release bank has not been verified yet. Please verify the Release Bank in the Billing Summary before paying release.');
            return;
          }
        } else {
          const isPartial = saleDetails?.paymentType === 'partial';
          const bankRequired = saleDetails?.paymentType === 'bank' || (isPartial && Number(values.bankAmount || saleDetails?.bankAmount) > 0);
          const targetSaleBankId = saleDetails?.bank?._id || saleDetails?.bank;
          const saleAcct = saleDetails?.bank?.accountNo;
          const isSaleVerified = Boolean(
            (saleDetails?.financePayments || []).some(
              (fp) => fp.isVerified && (
                fp.stage === 'sale' ||
                (targetSaleBankId && String(fp.bank?.bankId || fp.bank?._id) === String(targetSaleBankId)) ||
                (saleAcct && fp.bank?.accountNo && String(fp.bank.accountNo) === String(saleAcct))
              )
            )
          );
          if (bankRequired && !isSaleVerified) {
            alert('Customer sale bank has not been verified yet. Please verify the bank in the Billing Summary before updating finance.');
            return;
          }
        }
      }

      setLoading(true);

      const payload = {};
      if (type === 'finance') {
        const isPartial = saleDetails?.paymentType === 'partial';
        if (isPartial) {
          const cashNum = values.cashAmount !== '' ? Number(values.cashAmount) : 0;
          const bankNum = values.bankAmount !== '' ? Number(values.bankAmount) : 0;
          const newPayments = [];

          if (cashNum > 0) {
            newPayments.push({
              amount: cashNum,
              paymentType: 'cash',
              bank: null,
              proof: bankNum === 0 ? values.proof : '',
              comments: values.comments,
              createdAt: new Date(),
            });
          }

          if (bankNum > 0) {
            newPayments.push({
              amount: bankNum,
              paymentType: 'bank',
              bank: selectedBank ? {
                bankId: selectedBank._id,
                bankName: selectedBank.bankName,
                accountNo: selectedBank.accountNo,
              } : (saleDetails?.bank ? {
                bankId: saleDetails.bank._id || saleDetails.bank,
                bankName: saleDetails.bank.bankName,
                accountNo: saleDetails.bank.accountNo,
              } : null),
              proof: values.proof,
              comments: values.comments,
              createdAt: new Date(),
            });
          }

          payload.newFinancePayments = newPayments;
          payload.financeAmount = (saleDetails?.financeAmount || 0) + cashNum + bankNum;
          payload.payableAmount = saleDetails?.payableAmount;
          payload.financeComments = values.comments;
          if (values.proof) payload.financeProof = values.proof;
        } else {
          const prevPaid = (saleDetails?.financePayments || [])
            .filter((fp) => fp.stage === 'sale')
            .reduce((sum, fp) => sum + (+fp.amount || 0), 0);
          const enteredAmt = values.amount !== '' ? Number(values.amount) : 0;
          payload.financeAmount = saleDetails?.status === 'completed'
            ? (values.amount !== '' ? Number(values.amount) : undefined)
            : (prevPaid + enteredAmt);
          payload.payableAmount = saleDetails?.payableAmount;
          payload.financeComments = values.comments;
          payload.financeProof = values.proof;
          const selectedPt = values.paymentType || (saleDetails?.paymentType === 'cash' ? 'cash' : 'bank');
          payload.newFinancePayment = {
            amount: enteredAmt,
            paymentType: selectedPt,
            bank: selectedPt === 'bank' && selectedBank ? {
              bankId: selectedBank._id,
              bankName: selectedBank.bankName,
              accountNo: selectedBank.accountNo,
            } : null,
            proof: values.proof,
            comments: values.comments,
            createdAt: new Date(),
          };
        }

        if (values.isCompleted || saleDetails?.status === 'completed' || saleDetails?.financeCompleted) {
          payload.financeCompleted = true;
          payload.financeCompletedAt = saleDetails?.financeCompletedAt || new Date();
          if (saleDetails?.status === 'completed') {
            payload.status = 'completed';
            payload.isFinanceReupdate = true;
          } else {
            const isPhys = (saleDetails?.saleType || saleType || '').toLowerCase() === 'physical';
            const isAssigneeDone = Boolean(saleDetails?.assigneeCompleted ?? assigneeCompleted);
            payload.status = (isPhys || isAssigneeDone) ? 'completed' : 'release pending';
          }
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
          handleModalClose();
          fetchData();
        } else {
          alert(data.message || 'Verification failed. Please ensure prior stages are approved.');
        }
      });
    },
  });

  const isPledgedReleaseStage = (saleDetails?.saleType || saleType || '').toLowerCase() === 'pledged' && !(saleDetails?.assigneeCompleted ?? assigneeCompleted);
  const bankReleases = isPledgedReleaseStage
    ? (saleDetails?.release || []).filter((r) => r.paymentType === 'bank')
    : [];
  const hasBankRelease = bankReleases.length > 0;
  const showBankDropdown = type === 'finance' && (
    isPledgedReleaseStage ? hasBankRelease : saleDetails?.paymentType !== 'cash'
  );

  const bankRequired = isPledgedReleaseStage
    ? (saleDetails?.release || []).some((r) => r.paymentType === 'bank' || r.bank)
    : (saleDetails?.paymentType === 'bank' || (saleDetails?.paymentType === 'partial' && Number(saleDetails?.bankAmount) > 0));
  const isBankPendingVerification = type === 'finance' && bankRequired && !saleDetails?.isBankVerified;

  useEffect(() => {
    if (open && id) {
      getSalesById(id).then((res) => {
        if (res?.status && res?.data) {
          const sale = res.data;
          setSaleDetails(sale);
          if (type === 'finance') {
            const isPledged = (sale.saleType || saleType || '').toLowerCase() === 'pledged';
            const isPledgedStage = isPledged && !sale.assigneeCompleted;
            const releases = sale.release || [];
            const hasBankRel = releases.some((r) => String(r?.paymentType || '').toLowerCase() === 'bank');
            const hasCashRel = releases.some((r) => String(r?.paymentType || '').toLowerCase() === 'cash');

            let detectedPaymentType = 'bank';
            if (isPledgedStage) {
              if (hasCashRel && !hasBankRel) {
                detectedPaymentType = 'cash';
              } else if (hasBankRel) {
                detectedPaymentType = 'bank';
              } else {
                detectedPaymentType = (sale.paymentType || '').toLowerCase() || 'cash';
              }
            } else if (sale.paymentType) {
              detectedPaymentType = sale.paymentType.toLowerCase();
            }
            setFieldValue('paymentType', detectedPaymentType);

            if (sale.status === 'completed') {
              if (sale.paymentType === 'partial') {
                const initCash = sale.cashAmount || 0;
                const initBank = sale.bankAmount || 0;
                setFieldValue('cashAmount', initCash);
                setFieldValue('bankAmount', initBank);
                setFieldValue('amount', initCash + initBank);
              } else {
                const fullPayable = sale.financeAmount || sale.payableAmount || 0;
                setFieldValue('amount', Math.round(fullPayable));
              }
              if (sale.bank) {
                const saleBankId = sale.bank._id || sale.bank;
                const found = (sale.customer?.bank || []).find(
                  (b) => String(b._id) === String(saleBankId) || b.accountNo === sale.bank?.accountNo
                );
                if (found) {
                  setSelectedBank(found);
                  setFieldValue('bankId', found._id?.toString() || found.accountNo);
                }
              }
              if (sale.financeProof) {
                setFieldValue('proof', sale.financeProof);
                setPreview(sale.financeProof.startsWith('http') ? sale.financeProof : `${global.baseURL}/fileuploads/${sale.financeProof}`);
              }
              if (sale.financeComments) {
                setFieldValue('comments', sale.financeComments);
              }
            } else if (isPledgedStage) {
              const bReleases = (sale.release || []).filter((r) => r.paymentType === 'bank');
              const totalReleaseBankAmt = bReleases.reduce((sum, r) => sum + (+r.payableAmount || 0), 0);
              const totalReleaseAmt = (sale.release || []).reduce((sum, r) => sum + (+r.payableAmount || 0), 0);
              const targetTotal = bReleases.length > 0 ? totalReleaseBankAmt : totalReleaseAmt;
              const existingReleasePayments = (sale.financePayments || []).filter((fp) => (fp.stage || 'release') === 'release');
              const alreadyPaidRelease = existingReleasePayments.reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const remRelease = Math.max(0, targetTotal - alreadyPaidRelease);

              setFieldValue('amount', Math.round(remRelease > 0 ? remRelease : targetTotal));

              if (sale.financeProof) {
                setFieldValue('proof', sale.financeProof);
                setPreview(sale.financeProof.startsWith('http') ? sale.financeProof : `${global.baseURL}/fileuploads/${sale.financeProof}`);
              }
              if (sale.financeComments) {
                setFieldValue('comments', sale.financeComments);
              }
              if (sale.financeCompleted) {
                setFieldValue('isCompleted', true);
              }

              if (bReleases.length > 0) {
                const targetBankId = bReleases[0]?.bank?._id || bReleases[0]?.bank;
                const foundBank = (sale.customer?.bank || []).find(
                  (b) => String(b._id) === String(targetBankId) || b.accountNo === bReleases[0]?.bank?.accountNo
                );
                if (foundBank) {
                  setSelectedBank(foundBank);
                  setFieldValue('bankId', foundBank._id?.toString() || foundBank.accountNo);
                }
              }
            } else if (sale.paymentType === 'partial') {
              const existingSalePayments = (sale.financePayments || []).filter((fp) => fp.stage === 'sale');
              const alreadyPaidCash = existingSalePayments
                .filter((fp) => fp.paymentType === 'cash' || (!fp.bank?.bankId && !fp.bank?.accountNo && !fp.bank?.bankName))
                .reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const alreadyPaidBank = existingSalePayments
                .filter((fp) => fp.paymentType === 'bank' || fp.bank?.accountNo || fp.bank?.bankName)
                .reduce((sum, fp) => sum + (+fp.amount || 0), 0);

              const expectedCash = sale.cashAmount || 0;
              const expectedBank = sale.bankAmount || 0;
              const remCash = Math.max(0, expectedCash - alreadyPaidCash);
              const remBank = Math.max(0, expectedBank - alreadyPaidBank);

              setFieldValue('cashAmount', remCash);
              setFieldValue('bankAmount', remBank);
              setFieldValue('amount', remCash + remBank);

              if (sale.bank) {
                const saleBankId = sale.bank._id || sale.bank;
                const found = (sale.customer?.bank || []).find(
                  (b) => String(b._id) === String(saleBankId) || b.accountNo === sale.bank?.accountNo
                );
                if (found) {
                  setSelectedBank(found);
                  setFieldValue('bankId', found._id?.toString() || found.accountNo);
                }
              }
            } else {
              const fullPayable = sale.payableAmount !== undefined && sale.payableAmount !== null ? sale.payableAmount : 0;
              const existingSalePayments = (sale.financePayments || []).filter((fp) => fp.stage === 'sale');
              const alreadyPaidSale = existingSalePayments.reduce((sum, fp) => sum + (+fp.amount || 0), 0);
              const remSale = Math.max(0, fullPayable - alreadyPaidSale);

              setFieldValue('amount', Math.round(remSale > 0 ? remSale : fullPayable));

              if (sale.bank) {
                const saleBankId = sale.bank._id || sale.bank;
                const found = (sale.customer?.bank || []).find((b) => String(b._id) === String(saleBankId));
                if (found) {
                  setSelectedBank(found);
                  setFieldValue('bankId', found._id?.toString() || found.accountNo);
                }
              }
            }
          }
        }
      });
    } else {
      setSaleDetails(null);
      setSelectedBank(null);
    }
  }, [open, id, type]);

  const handleModalClose = () => {
    setPreview(null);
    setFileType('');
    setPdfBlobUrl(null);
    setSelectedBank(null);
    resetForm();
    handleClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        setFileType('pdf');
        setPreview(file.name);
        setPdfBlobUrl(URL.createObjectURL(file));
      } else {
        setFileType('image');
        setPreview(URL.createObjectURL(file));
        setPdfBlobUrl(null);
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadId', id);
      formData.append('uploadName', `${type}_proof`);
      const res = await createFile(formData);
      setIsUploading(false);
      if (res.status) {
        setFieldValue('proof', res.data.uploadedFile);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleModalClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{sentenceCase(type || '')} Verification</DialogTitle>
        <DialogContent sx={{ pt: 2, mt: 1 }}>
          <Grid container spacing={3}>
            {type === 'finance' && saleDetails?.paymentType === 'partial' ? (
              <>
                <Grid item xs={12}>
                  <Box sx={{ p: 2, bgcolor: '#f4f6f8', borderRadius: 1.5, border: '1px dashed #cfd8dc' }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, fontWeight: 700 }}>
                      Partial Payment Breakdown
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Total Payable</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          ₹{Number(saleDetails?.payableAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Expected Cash</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'success.dark' }}>
                          ₹{Number(saleDetails?.cashAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption" color="text.secondary" display="block">Expected Bank</Typography>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'info.dark' }}>
                          ₹{Number(saleDetails?.bankAmount || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="cashAmount"
                    label="Cash Amount"
                    InputLabelProps={{ shrink: true }}
                    type="number"
                    value={values.cashAmount}
                    error={touched.cashAmount && errors.cashAmount && true}
                    helperText={touched.cashAmount && errors.cashAmount ? errors.cashAmount : `Expected: ₹${Number(saleDetails?.cashAmount || 0).toLocaleString('en-IN')}`}
                    fullWidth
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    name="bankAmount"
                    label="Bank Amount"
                    InputLabelProps={{ shrink: true }}
                    type="number"
                    value={values.bankAmount}
                    error={touched.bankAmount && errors.bankAmount && true}
                    helperText={touched.bankAmount && errors.bankAmount ? errors.bankAmount : `Expected: ₹${Number(saleDetails?.bankAmount || 0).toLocaleString('en-IN')}`}
                    fullWidth
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="choose-bank-label">Choose Bank (for Bank portion)</InputLabel>
                    <Select
                      labelId="choose-bank-label"
                      id="choose-bank-select"
                      name="bankId"
                      value={values.bankId || ''}
                      label="Choose Bank (for Bank portion)"
                      onChange={(e) => {
                        handleChange(e);
                        const banks = saleDetails?.customer?.bank || [];
                        const found = banks.find((b) => (b._id?.toString() || b.accountNo) === e.target.value);
                        setSelectedBank(found || null);
                      }}
                    >
                      {(saleDetails?.customer?.bank || []).map((b) => (
                        <MenuItem key={b._id || b.accountNo} value={b._id?.toString() || b.accountNo}>
                          {b.bankName} - {b.accountNo}
                        </MenuItem>
                      ))}
                      {(!saleDetails?.customer?.bank || saleDetails?.customer?.bank.length === 0) && (
                        <MenuItem value="" disabled>
                          No bank added for this customer
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </Grid>
              </>
            ) : (
              <>
                {type === 'finance' && (
                  <Grid item xs={12}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Typography variant="subtitle2" sx={{ color: 'text.secondary', minWidth: 110 }}>
                        Payment Mode:
                      </Typography>
                      {isPledgedReleaseStage ? (
                        (bankReleases.length > 0 && !saleDetails?.release?.some((r) => String(r?.paymentType || '').toLowerCase() === 'cash')) ? (
                          <Label color="info" sx={{ fontSize: '0.875rem', px: 1.5, py: 0.5 }}>
                            Bank Transfer
                          </Label>
                        ) : (!bankReleases.length && saleDetails?.release?.some((r) => String(r?.paymentType || '').toLowerCase() === 'cash')) ? (
                          <Label color="success" sx={{ fontSize: '0.875rem', px: 1.5, py: 0.5 }}>
                            Cash
                          </Label>
                        ) : (
                          <RadioGroup
                            row
                            name="paymentType"
                            value={values.paymentType || (saleDetails?.paymentType === 'cash' ? 'cash' : 'bank')}
                            onChange={(e) => {
                              handleChange(e);
                              if (e.target.value === 'cash') {
                                setSelectedBank(null);
                                setFieldValue('bankId', '');
                              }
                            }}
                          >
                            <FormControlLabel value="cash" control={<Radio size="small" />} label="Cash" />
                            <FormControlLabel value="bank" control={<Radio size="small" />} label="Bank Transfer" />
                          </RadioGroup>
                        )
                      ) : (saleDetails?.paymentType === 'cash' || values.paymentType === 'cash') && saleDetails?.paymentType !== 'bank' ? (
                        <Label color="success" sx={{ fontSize: '0.875rem', px: 1.5, py: 0.5 }}>
                          Cash
                        </Label>
                      ) : (saleDetails?.paymentType === 'bank' || values.paymentType === 'bank') && saleDetails?.paymentType !== 'cash' ? (
                        <Label color="info" sx={{ fontSize: '0.875rem', px: 1.5, py: 0.5 }}>
                          Bank Transfer
                        </Label>
                      ) : (
                        <RadioGroup
                          row
                          name="paymentType"
                          value={values.paymentType || (saleDetails?.paymentType === 'cash' ? 'cash' : 'bank')}
                          onChange={(e) => {
                            handleChange(e);
                            if (e.target.value === 'cash') {
                              setSelectedBank(null);
                              setFieldValue('bankId', '');
                            }
                          }}
                        >
                          <FormControlLabel value="cash" control={<Radio size="small" />} label="Cash" />
                          <FormControlLabel value="bank" control={<Radio size="small" />} label="Bank Transfer" />
                        </RadioGroup>
                      )}
                    </Stack>
                  </Grid>
                )}

                {type === 'finance' && (values.paymentType || (saleDetails?.paymentType === 'cash' ? 'cash' : 'bank')) === 'bank' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="choose-bank-label">
                        {isPledgedReleaseStage ? 'Choose Release Bank' : 'Choose Bank'}
                      </InputLabel>
                      <Select
                        labelId="choose-bank-label"
                        id="choose-bank-select"
                        name="bankId"
                        value={values.bankId || ''}
                        label={isPledgedReleaseStage ? 'Choose Release Bank' : 'Choose Bank'}
                        onChange={(e) => {
                          handleChange(e);
                          const banks = saleDetails?.customer?.bank || [];
                          const found = banks.find((b) => (b._id?.toString() || b.accountNo) === e.target.value);
                          setSelectedBank(found || null);
                        }}
                      >
                        {(saleDetails?.customer?.bank || []).map((b) => {
                          const isRelBank = (saleDetails?.release || []).some(
                            (r) => String(r.bank?._id || r.bank) === String(b._id) || r.bank?.accountNo === b.accountNo
                          );
                          return (
                            <MenuItem key={b._id || b.accountNo} value={b._id?.toString() || b.accountNo}>
                              {b.bankName} - {b.accountNo} {isRelBank ? '(Release Bank)' : ''}
                            </MenuItem>
                          );
                        })}
                        {(!saleDetails?.customer?.bank || saleDetails?.customer?.bank.length === 0) && (
                          <MenuItem value="" disabled>
                            No bank added for this customer
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <TextField
                    sx={{ mt: 1 }}
                    name="amount"
                    label="Payment Amount"
                    InputLabelProps={{ shrink: true }}
                    type="number"
                    value={values.amount}
                    error={touched.amount && errors.amount && true}
                    fullWidth
                    onBlur={handleBlur}
                    onChange={handleChange}
                    onFocus={(e) => e.target.select()}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                InputLabelProps={{ shrink: true }}
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
              <Typography variant="subtitle2" gutterBottom>
                Upload {type === 'finance' && saleDetails?.paymentType === 'partial' ? 'Bank Transfer Proof/Photo' : 'Proof/Photo'}
              </Typography>
              <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
              {preview && (
                fileType === 'pdf' ? (
                  <a
                    href={values.proof ? (values.proof.startsWith('http') ? values.proof : `${global.baseURL}/${values.proof}`) : (pdfBlobUrl || '#')}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, p: 2, border: '1px dashed #ccc', borderRadius: 1, cursor: 'pointer' }}>
                      <img src="/assets/doc.svg" alt="pdf document" style={{ width: '24px' }} />
                      <Typography variant="body2">{preview}</Typography>
                    </Box>
                  </a>
                ) : (
                  <a
                    href={values.proof ? (values.proof.startsWith('http') ? values.proof : `${global.baseURL}/${values.proof}`) : preview}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={preview} alt="Preview" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
                  </a>
                )
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

            {isBankPendingVerification && (
              <Grid item xs={12}>
                <MuiAlert severity="error" sx={{ mb: 1 }}>
                  Customer bank has not been verified yet. Please verify the bank in the Billing Summary before updating finance.
                </MuiAlert>
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
          <Button onClick={handleModalClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading || isUploading} disabled={isUploading || isBankPendingVerification} sx={{ color: '#fff' }}>
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







