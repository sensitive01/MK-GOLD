import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
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
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import * as FileSaver from 'file-saver';
import { useFormik } from 'formik';
import moment from 'moment';
import * as XLSX from 'xlsx';
import * as Yup from 'yup';
// components
import { CreateExpense, UpdateExpense, ViewExpense } from '../../components/accounts/expense';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { ExpenseListHead, ExpenseListToolbar } from '../../sections/@dashboard/expense';
// mock
import { deleteExpenseById, getExpense, updateExpense } from '../../apis/accounts/expense';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'amount', label: 'Amount (₹)', alignRight: false },
  { id: 'branchName', label: 'Branch', alignRight: false },
  { id: 'details', label: 'Details / Notes', alignRight: false },
  { id: 'proofs', label: 'Proofs / Files', alignRight: false },
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
    return filter(array, (row) => row?.branch?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Expense() {
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
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const form = useRef();

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [openViewModal, setOpenViewModal] = useState(false);

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
      setOpenBackdrop(true);
      getExpense({
        createdAt: {
          $gte: values.fromDate?.format("YYYY-MM-DD"),
          $lte: values.toDate?.format("YYYY-MM-DD"),
        },
      }).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
      setFilterOpen(false);
    },
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
      getExpense(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [values.fromDate, values.toDate]
  );

  useEffect(() => {
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
    deleteExpenseById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteExpenseById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Expense deleted',
        severity: 'success',
      });
    });
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
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

  function Status(props) {
    return (
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 175, flexWrap: 'nowrap' }}>
        <Button
          variant="contained"
          size="small"
          color="success"
          startIcon={<Iconify icon="eva:checkmark-circle-2-fill" width={16} height={16} />}
          sx={{
            py: 0.5,
            px: 1.25,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
          onClick={() => {
            updateExpense(props._id, { status: 'approved' }).then(() => {
              fetchData();
              setNotify({
                open: true,
                message: 'Expense Approved Successfully!',
                severity: 'success',
              });
            });
          }}
        >
          Approve
        </Button>
        <Button
          variant="contained"
          size="small"
          color="error"
          startIcon={<Iconify icon="eva:close-circle-fill" width={16} height={16} />}
          sx={{
            py: 0.5,
            px: 1.25,
            fontSize: '0.75rem',
            fontWeight: 600,
            textTransform: 'none',
            whiteSpace: 'nowrap',
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
          onClick={() => {
            updateExpense(props._id, { status: 'rejected' }).then(() => {
              fetchData();
              setNotify({
                open: true,
                message: 'Expense Rejected Successfully!',
                severity: 'warning',
              });
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
  };

  return (
    <>
      <Helmet>
        <title> Expense | MK Gold </title>
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
            {typeof notify.message === 'string' ? notify.message : JSON.stringify(notify.message || '')}
          </Alert>
        </Snackbar>

      <Container maxWidth="xl" sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          spacing={{ xs: 1.5, sm: 2 }}
          mb={{ xs: 2.5, sm: 4 }}
        >
          <Typography variant="h4" gutterBottom sx={{ color: '#fff', mb: { xs: 0, sm: 1 } }}>
            Expense
          </Typography>
          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={handleFilterOpen}
            >
              Filter
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setToggleContainerType('create');
                setToggleContainer(true);
              }}
            >
              New Expense
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Iconify icon="carbon:document-export" />}
              onClick={() => {
                handleExport(
                  data?.map((e) => ({
                    Type: e.type === 'Others' && e.otherTypeName ? `Others (${e.otherTypeName})` : e.type,
                    Amount: e.amount,
                    Branch: e.branch?.branchName ? `${e.branch.branchName}${e.branch.branchId ? ` (${e.branch.branchId})` : ''}` : '-',
                    OpeningRead: e.openingRead ?? '',
                    ClosingRead: e.closingRead ?? '',
                    OverallRead: e.overallRead != null ? `${e.overallRead} km` : '',
                    BillId: e.billId || '',
                    Employee: e.employee?.name || '',
                    Note: e.note,
                    Status: e.status,
                    Date: moment(e.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                  })),
                  'Expenses'
                );
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {(values.fromDate || values.toDate) && (
          <Typography variant="body2" sx={{ color: '#fff', mb: 2, opacity: 0.9 }}>
            From Date: {values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : '-'}, To Date:{' '}
            {values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : '-'}
          </Typography>
        )}

        <Card>
          <ExpenseListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar sx={{ width: '100%' }}>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table sx={{ minWidth: 800 }}>
                <ExpenseListHead
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
                  {filteredData?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)?.map((row) => {
                    const { _id, type, amount, branch, note, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        {false && (
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                          </TableCell>
                        )}
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => { setOpenId(_id); setOpenViewModal(true); }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {type}
                          </Typography>
                          {type === 'Others' && row.otherTypeName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                              ({row.otherTypeName})
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', fontWeight: 600, cursor: 'pointer' }} onClick={() => { setOpenId(_id); setOpenViewModal(true); }}>
                          ₹{Number(amount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={() => { setOpenId(_id); setOpenViewModal(true); }}>
                          {branch?.branchName ? (
                            <>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {branch.branchName}
                              </Typography>
                              {branch.branchId && (
                                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                  ({branch.branchId})
                                </Typography>
                              )}
                            </>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell align="left" sx={{ minWidth: 200, cursor: 'pointer' }} onClick={() => { setOpenId(_id); setOpenViewModal(true); }}>
                          {type === 'Fuel' && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                              Start: <strong>{row.openingRead ?? '-'}</strong> | End: <strong>{row.closingRead ?? '-'}</strong> | Total: <strong>{row.overallRead != null ? `${row.overallRead} km` : '-'}</strong>
                            </Typography>
                          )}
                          {type === 'Sales Incentive' && (
                            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mb: 0.5 }}>
                              Bill: <strong>{row.billId || '-'}</strong> | Emp: <strong>{row.employee?.name || '-'}</strong>
                            </Typography>
                          )}
                          {note && (
                            <Typography variant="body2" sx={{ display: 'block', color: 'text.primary', fontSize: '0.82rem' }}>
                              {note}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                          {row.attachments && row.attachments.length > 0 ? (
                            <Stack direction="row" spacing={0.5} alignItems="center" flexWrap="nowrap">
                              {row.attachments.map((file, idx) => (
                                <IconButton
                                  key={idx}
                                  size="small"
                                  color="primary"
                                  component="a"
                                  href={file.uploadedFile}
                                  target="_blank"
                                  title={file.uploadType || 'Proof'}
                                  sx={{
                                    bgcolor: 'action.hover',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    p: 0.5,
                                    borderRadius: 1,
                                  }}
                                >
                                  <Iconify icon="mdi:file-eye-outline" width={18} height={18} />
                                </IconButton>
                              ))}
                            </Stack>
                          ) : (
                            <Typography variant="caption" color="text.secondary">None</Typography>
                          )}
                        </TableCell>
                        <TableCell align="left" sx={{ minWidth: 180, whiteSpace: 'nowrap' }}>
                          {status === 'pending' ? (
                            <Status status={status} _id={_id} />
                          ) : (
                            <Label
                              color={
                                (status === 'approved' && 'success') || (status === 'rejected' && 'error') || 'warning'
                              }
                            >
                              {sentenceCase(status)}
                            </Label>
                          )}
                        </TableCell>
                        <TableCell align="left" sx={{ whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                            {moment(createdAt).format('YYYY-MM-DD')}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            {moment(createdAt).format('HH:mm:ss')}
                          </Typography>
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
        sx={{ display: toggleContainer === true && toggleContainerType === 'create' ? 'block' : 'none' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            
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

        <CreateExpense setToggleContainer={setToggleContainer} id={openId} setNotify={setNotify} />
      </Container>

      <Container
        maxWidth="xl"
        sx={{ display: toggleContainer === true && toggleContainerType === 'update' ? 'block' : 'none' }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Update Expense
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

        <UpdateExpense setToggleContainer={setToggleContainer} id={openId} setNotify={setNotify} />
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
            setOpenViewModal(true);
          }}
        >
          <Iconify icon={'eva:eye-fill'} sx={{ mr: 2 }} />
          View
        </MenuItem>

        <MenuItem
          onClick={() => {
            setOpen(null);
            setToggleContainerType('update');
            setToggleContainer(!toggleContainer);
          }}
        >
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
          Edit
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

      <Dialog open={filterOpen} onClose={handleFilterClose} fullWidth maxWidth="xs">
        <form ref={form} onSubmit={handleSubmit} autoComplete="off">
          <DialogTitle>Filter</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ pt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterMoment} error={touched.fromDate && errors.fromDate && true}>
                    <DesktopDatePicker
                      label={touched.fromDate && errors.fromDate ? errors.fromDate : 'From Date'}
                      inputFormat="MM/DD/YYYY"
                      name="fromDate"
                      value={values.fromDate}
                      onChange={(value) => {
                        setFieldValue('fromDate', value, true);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth helperText={null} />}
                    />
                  </LocalizationProvider>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <LocalizationProvider dateAdapter={AdapterMoment} error={touched.toDate && errors.toDate && true}>
                    <DesktopDatePicker
                      label={touched.toDate && errors.toDate ? errors.toDate : 'To Date'}
                      inputFormat="MM/DD/YYYY"
                      name="toDate"
                      value={values.toDate}
                      onChange={(value) => {
                        setFieldValue('toDate', value, true);
                      }}
                      renderInput={(params) => <TextField {...params} fullWidth helperText={null} />}
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

      <ViewExpense
        open={openViewModal}
        onClose={() => setOpenViewModal(false)}
        id={openId}
        onStatusUpdate={fetchData}
        setNotify={setNotify}
      />
    </>
  );
}




