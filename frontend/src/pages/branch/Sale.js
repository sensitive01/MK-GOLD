import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Modal,
  Paper,
  Popover,
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
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import { CreateSale, SaleDetail, SalePrint } from '../../components/branch/sales';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { SaleListHead, SaleListToolbar } from '../../sections/@dashboard/sales';
// mock
import { deleteSalesById, findSales, updateSales } from '../../apis/branch/sales';
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Grid from '@mui/material/Grid';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'billId', label: 'Bill Id', alignRight: false },
  { id: 'customer', label: 'Customer', alignRight: false },
  { id: 'saleType', label: 'Sale Type', alignRight: false },
  { id: 'netAmount', label: 'Net Amount', alignRight: false },
  { id: 'branchId', label: 'Branch Id', alignRight: false },
  { id: 'branchName', label: 'Branch Name', alignRight: false },
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
    return filter(array || [], (row) => row.customer?.phoneNumber.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Sale() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [saleIdToEdit, setSaleIdToEdit] = useState(null);
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

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    (query = {}) => {
      if (!query.branch) query.branch = branch?._id;
      findSales(query).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    [branch._id]
  );

  useEffect(() => {
    setBranch(auth.user.branch);
    fetchData({
      branch: auth.user.branch?._id,
    });
  }, [toggleContainer, auth.user.branch, fetchData]);

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


    const [openVerifyModal, setOpenVerifyModal] = useState(false);
    const [verifyType, setVerifyType] = useState('');


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
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setSaleIdToEdit(null);
                setToggleContainer(true);
                setToggleContainerType('create');
              }}
            >
              New Sale
            </Button>
          </Stack>
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
                    const { _id, billId, saleType, netAmount, branch: rowBranch, purchaseType, status, createdAt } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                        </TableCell>
                        <TableCell align="left">{billId}</TableCell>
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
                        <TableCell align="left">{sentenceCase(saleType)}</TableCell>
                        <TableCell align="left">&#8377; {netAmount}</TableCell>
                        <TableCell align="left">{rowBranch?.branchId}</TableCell>
                        <TableCell align="left">{rowBranch?.branchName}</TableCell>
                        <TableCell align="left">{sentenceCase(purchaseType)}</TableCell>
                        <TableCell align="left">
                          <Status 
                            status={status} 
                            _id={_id} 
                            assignee={row.assignee?._id || row.assignee}
                            fetchData={fetchData}
                          />
                        </TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="right">
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

      {toggleContainer === true && toggleContainerType === 'create' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              {saleIdToEdit ? 'Edit Sale' : 'Create Sale'}
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => {
                setToggleContainer(false);
              }}
            >
              Back
            </Button>
          </Stack>

          <CreateSale setToggleContainer={setToggleContainer} id={saleIdToEdit} setNotify={setNotify} />
        </Container>
      )}

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

      <Dialog open={openLogModal} onClose={handleCloseLogModal}>
        <DialogTitle>Approval Log</DialogTitle>
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

function Status(props) {
  const { _id, status, assignee, fetchData } = props;
  const auth = useSelector((state) => state.auth);
  const userType = auth.user?.userType?.toLowerCase();
  const employeeId = auth.user?.employee?._id || auth.user?.employee;

  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState('');

  const handleVerify = (type) => {
    setVerifyType(type);
    setOpenVerifyModal(true);
  };

  let content = <Label color={status === 'completed' ? 'success' : 'error'}>{sentenceCase(status)}</Label>;

  // Finance Step
  if (status === 'finance pending') {
    if (userType === 'finance' || userType === 'accounts' || userType === 'admin') {
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
    if (employeeId === assignee || userType === 'admin') {
      content = (
        <Button variant="contained" size="small" onClick={() => handleVerify('assignee')}>
          Update Verification
        </Button>
      );
    } else {
      content = <Label color="warning">Release Pending</Label>;
    }
  }

  // Admin Approval Step
  else if (status === 'admin approve pending') {
    if (userType === 'admin') {
      content = (
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => {
              updateSales(_id, { status: 'completed' }).then(() => fetchData());
            }}
          >
            Approve
          </Button>
          <Button
            variant="contained"
            size="small"
            color="error"
            onClick={() => {
              updateSales(_id, { status: 'finance pending' }).then(() => fetchData());
            }}
          >
            Reject
          </Button>
        </Stack>
      );
    } else {
      content = <Label color="info">Admin Approval Pending</Label>;
    }
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
      />
    </>
  );
}






function VerificationModal({ open, id, type, handleClose, fetchData }) {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);

  const [ornamentValues, setOrnamentValues] = useState({
    ornamentType: '',
    quantity: '',
    grossWeight: '',
    stoneWeight: '',
    netWeight: '',
    purity: '',
    netAmount: '',
  });

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
      setLoading(true);
      
      const payload = {};
      if (type === 'finance') {
        payload.financeAmount = values.amount;
        payload.financeComments = values.comments;
        payload.financeProof = values.proof;
        if (values.isCompleted) {
          payload.financeCompleted = true;
          payload.financeCompletedAt = new Date();
          payload.status = 'release pending';
        }
      } else {
        payload.assigneeAmount = values.amount;
        payload.assigneeComments = values.comments;
        payload.assigneeProof = values.proof;
        payload.ornaments = ornaments; // Add ornaments at this step
        if (values.isCompleted) {
          payload.assigneeCompleted = true;
          payload.assigneeCompletedAt = new Date();
          payload.status = 'admin approve pending';
        }
      }

      updateSales(id, payload).then((data) => {
        setLoading(false);
        if (data.status) {
          handleClose();
          fetchData();
        }
      });
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadId', id);
      const res = await createFile(formData);
      if (res.status) {
        setFieldValue('proof', res.data.fileUrl || res.data.path);
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
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
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.amount && !!errors.amount}
                helperText={touched.amount && errors.amount}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={2}>
                <Typography variant="subtitle2">Upload Proof</Typography>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                {preview && (
                  <Box sx={{ mt: 2, position: 'relative', width: '100%', height: 200, borderRadius: 1, overflow: 'hidden', border: '1px solid #eee' }}>
                    <img src={preview} alt="Proof Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </Box>
                )}
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                value={values.comments}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.comments && !!errors.comments}
                helperText={touched.comments && errors.comments}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>

            {type === 'assignee' && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">Add Ornaments</Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setShowOrnamentForm(!showOrnamentForm)}
                  >
                    {showOrnamentForm ? 'Hide Form' : 'Add New'}
                  </Button>
                </Stack>

                {showOrnamentForm && (
                  <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2 }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={ornamentValues.ornamentType}
                            onChange={(e) => setOrnamentValues({ ...ornamentValues, ornamentType: e.target.value })}
                            label="Type"
                          >
                             <MenuItem value="Bangles">Bangles</MenuItem>
                             <MenuItem value="Chain">Chain</MenuItem>
                             <MenuItem value="Ring">Ring</MenuItem>
                             <MenuItem value="Necklace">Necklace</MenuItem>
                             {/* Simplified for now, can add more */}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Qty"
                          size="small"
                          type="number"
                          value={ornamentValues.quantity}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, quantity: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <TextField
                          label="Gross Wt"
                          size="small"
                          type="number"
                          value={ornamentValues.grossWeight}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, grossWeight: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Net Wt"
                          size="small"
                          type="number"
                          value={ornamentValues.netWeight}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, netWeight: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={6} sm={4}>
                        <TextField
                          label="Purity"
                          size="small"
                          type="number"
                          value={ornamentValues.purity}
                          onChange={(e) => setOrnamentValues({ ...ornamentValues, purity: e.target.value })}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
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
                      {ornaments.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center">No ornaments added yet</TableCell>
                        </TableRow>
                      )}
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
