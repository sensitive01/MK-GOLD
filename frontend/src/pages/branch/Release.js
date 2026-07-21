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
    TableHead,
    TableBody,
    TableCell,
    TableContainer,
    TablePagination,
    TableRow,
    Typography,
    Divider,
    Link,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
// components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
// sections
import { ReleaseListHead, ReleaseListToolbar } from '../../sections/@dashboard/release';
// mock
import { deleteReleaseById, findRelease, updateRelease, getReleaseById } from '../../apis/branch/release';
import { getGoldRateByState } from '../../apis/branch/gold-rate';
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { LoadingButton } from '@mui/lab';
import TimelineView from '../../components/TimelineView';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import PropTypes from 'prop-types';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'pledgeId', label: 'Pledge Id', alignRight: false },
  { id: 'pledgedIn', label: 'Pledged In', alignRight: false },
  { id: 'weight', label: 'Weight', alignRight: false },
  { id: 'pledgeAmount', label: 'Pledge Amount', alignRight: false },
  { id: 'pledgedDate', label: 'Pledged Date', alignRight: false },
  { id: 'payableAmount', label: 'Payable Amount', alignRight: false },
  { id: 'paymentType', label: 'Payment Type', alignRight: false },
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

function Status(props) {
  const { _id, status, assignee, userType, employeeId, fetchData } = props;
  const userTypeLower = userType?.toLowerCase() || '';
  const isAdmin = userTypeLower.includes('admin');
  const isTransactionExecutive = userTypeLower.includes('transaction_executive');

  const [openVerifyModal, setOpenVerifyModal] = useState(false);
  const [verifyType, setVerifyType] = useState('');

  const handleVerify = (type) => {
    setVerifyType(type);
    setOpenVerifyModal(true);
  };

  // Release Pending — only assignee (or admin/TE) can mark it complete
  if (status === 'release pending') {
    const isAssignee = assignee === employeeId;
    if (isAssignee || isAdmin || isTransactionExecutive) {
      return (
        <>
          <Button variant="contained" size="small" color="warning" onClick={() => handleVerify('release_complete')}>
            Mark Complete
          </Button>
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
    return <Label color="warning">Release Pending</Label>;
  }

  // Completed
  if (status === 'completed') {
    return <Label color="success">Completed</Label>;
  }

  // Fallback
  return <Label color="error">Unknown Status</Label>;
}

export default function Release() {
  const auth = useSelector((state) => state.auth);
  const [branch, setBranch] = useState({});
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [data, setData] = useState([]);
  const selectedReleaseObj = data?.find((s) => s._id === openId);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const handleOpenEditModal = () => setOpenEditModal(true);
  const handleCloseEditModal = () => setOpenEditModal(false);
  const [deleteType, setDeleteType] = useState('single');
  const userType = auth.user?.userType;
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);
  const handleOpenLogModal = () => setOpenLogModal(true);
  const handleCloseLogModal = () => setOpenLogModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

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
      findRelease(query).then((data) => {
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
  }, [auth.user.branch, fetchData]);

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
    deleteReleaseById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteReleaseById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Release deleted',
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
        <title> Release | MK Gold </title>
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

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Release
          </Typography>
        </Stack>

        <Card>
          <ReleaseListToolbar
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
                <ReleaseListHead
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
                    const {
                      _id,
                      pledgeId,
                      pledgedIn,
                      weight,
                      pledgeAmount,
                      pledgedDate,
                      payableAmount,
                      paymentType,
                      status,
                      createdAt,
                    } = row;
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
                          setOpenViewModal(true);
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
                        <TableCell align="left">{pledgeId}</TableCell>
                        <TableCell align="left">{sentenceCase(pledgedIn)}</TableCell>
                        <TableCell align="left">{weight}</TableCell>
                        <TableCell align="left">{pledgeAmount}</TableCell>
                        <TableCell align="left">{moment(pledgedDate).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="left">{payableAmount}</TableCell>
                        <TableCell align="left">{sentenceCase(paymentType)}</TableCell>
                        <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                          <Status 
                            status={status} 
                            _id={_id} 
                            assignee={row.assignee?._id || row.assignee}
                            financeCompleted={row.financeCompleted}
                            assigneeCompleted={row.assigneeCompleted}
                            userType={userType?.toLowerCase()}
                            employeeId={auth.user?.employee?._id || auth.user?.employee}
                            fetchData={fetchData}
                          />
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
                      <TableCell colSpan={11} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
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
                      <TableCell align="center" colSpan={11} sx={{ py: 3 }}>
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
          View Details
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

        {userType?.toLowerCase() !== 'transaction_executive' && (
          <MenuItem
            disabled={selectedReleaseObj?.status === 'completed'}
            onClick={() => {
              setOpen(null);
              handleOpenEditModal();
            }}
          >
            <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} />
            Edit
          </MenuItem>
        )}
        {/* global.canDelete(userType) && (
          <MenuItem
            disabled={selectedReleaseObj?.status === 'completed'}
            sx={{ color: selectedReleaseObj?.status === 'completed' ? 'text.disabled' : 'error.main' }}
            onClick={() => {
              setOpen(null);
              setDeleteType('single');
              handleOpenDeleteModal();
            }}
          >
            <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
            Delete
          </MenuItem>
        ) */}
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

      <Dialog open={openLogModal} onClose={handleCloseLogModal}>
        <DialogTitle>Approval Log</DialogTitle>
        <DialogContent dividers>
          {data?.find((s) => s._id === openId) ? (
            (() => {
              const release = data.find((s) => s._id === openId);
              return (
                <Box sx={{ minWidth: 400, py: 1 }}>
                   <Typography variant="subtitle2" gutterBottom>
                    Current Release Status: <span style={{ color: release.status === 'completed' ? 'green' : 'orange' }}>
                      {sentenceCase(release.status || 'pending')}
                    </span>
                  </Typography>

                  <TimelineView timeline={release.timeline} />
                  
                  {release.actionLog && release.actionLog.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
                        Raw Status Logs
                      </Typography>
                      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #eee' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#610C9F' }}>
                              <TableCell sx={{ color: '#fff' }}><strong>No.</strong></TableCell>
                              <TableCell sx={{ color: '#fff' }}><strong>Employee ID</strong></TableCell>
                              <TableCell sx={{ color: '#fff' }}><strong>Name</strong></TableCell>
                              <TableCell sx={{ color: '#fff' }}><strong>Action</strong></TableCell>
                              <TableCell sx={{ color: '#fff' }}><strong>Timestamp</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {release.actionLog.map((log, idx) => (
                              <TableRow key={idx}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell>{log.performerName?.employeeId || 'N/A'}</TableCell>
                                <TableCell>{log.performerName?.name || 'System'}</TableCell>
                                <TableCell sx={{ color: log.action === 'completed' ? 'green' : 'orange', fontWeight: 'bold', textTransform: 'capitalize' }}>
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

      <EditReleaseModal open={openEditModal} id={openId} handleClose={handleCloseEditModal} fetchData={fetchData} />
      <ViewReleaseModal open={openViewModal} id={openId} handleClose={() => setOpenViewModal(false)} />

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}

function EditReleaseModal({ open, id, handleClose, fetchData }) {
  const [loading, setLoading] = useState(false);
  const schema = Yup.object({
    pledgeId: Yup.string().required('Pledge Id is required'),
    pledgeAmount: Yup.number().required('Pledge Amount is required'),
    payableAmount: Yup.number().required('Payable Amount is required'),
    pledgedDate: Yup.date().required('Pledged Date is required'),
    releaseDate: Yup.date().required('Release Date is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setValues, setFieldValue } = useFormik({
    initialValues: {
      pledgeId: '',
      pledgeAmount: '',
      payableAmount: '',
      pledgedDate: moment(),
      releaseDate: moment(),
      paymentType: '',
      pledgedIn: '',
      pledgedBranch: '',
      comments: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setLoading(true);
      updateRelease(id, values).then((data) => {
        setLoading(false);
        if (data.status) {
          handleClose();
          fetchData();
        }
      });
    },
  });

  useEffect(() => {
    if (id && open) {
      getReleaseById(id).then((data) => {
        if (data.status) {
          const release = data.data;
          setValues({
            pledgeId: release.pledgeId,
            pledgeAmount: release.pledgeAmount,
            payableAmount: release.payableAmount,
            pledgedDate: moment(release.pledgedDate),
            releaseDate: moment(release.releaseDate),
            paymentType: release.paymentType,
            pledgedIn: release.pledgedIn,
            pledgedBranch: release.pledgedBranch,
            comments: release.comments,
          });
        }
      });
    }
  }, [id, open, setValues]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Edit Release</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgeId"
                label="Pledge Id"
                value={values.pledgeId}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.pledgeId && !!errors.pledgeId}
                helperText={touched.pledgeId && errors.pledgeId}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgeAmount"
                label="Pledge Amount"
                type="number"
                value={values.pledgeAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.pledgeAmount && !!errors.pledgeAmount}
                helperText={touched.pledgeAmount && errors.pledgeAmount}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="payableAmount"
                label="Payable Amount"
                type="number"
                value={values.payableAmount}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.payableAmount && !!errors.payableAmount}
                helperText={touched.payableAmount && errors.payableAmount}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Type</InputLabel>
                <Select name="paymentType" value={values.paymentType} onChange={handleChange} label="Payment Type">
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="bank">Bank</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="Pledged Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.pledgedDate}
                  onChange={(v) => setFieldValue('pledgedDate', v)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker
                  label="Release Date"
                  inputFormat="MM/DD/YYYY"
                  value={values.releaseDate}
                  onChange={(v) => setFieldValue('releaseDate', v)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgedIn"
                label="Pledged In"
                value={values.pledgedIn}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="pledgedBranch"
                label="Pledged Branch"
                value={values.pledgedBranch}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="comments"
                label="Comments"
                value={values.comments}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ color: '#fff' }}>
            Save Improvements
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}

EditReleaseModal.propTypes = {
  open: PropTypes.bool,
  id: PropTypes.string,
  handleClose: PropTypes.func,
  fetchData: PropTypes.func,
};

function VerificationModal({ open, id, type, handleClose, fetchData }) {
  const [loading, setLoading] = useState(false);
  const [ornaments, setOrnaments] = useState([]);
  const [showOrnamentForm, setShowOrnamentForm] = useState(false);
  const [proofDocuments, setProofDocuments] = useState([]);
  const [showProofForm, setShowProofForm] = useState(false);

  const [ornamentValues, setOrnamentValues] = useState({
    ornamentType: '',
    quantity: '',
    grossWeight: '',
    stoneWeight: '',
    netWeight: '',
    purity: '',
    netAmount: '',
  });

  const [proofValues, setProofValues] = useState({
    documentType: '',
    documentNo: '',
    documentFile: '',
  });

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleCloseVerifyModal = () => {
    setSelectedFiles([]);
    setUploading(false);
    handleClose();
  };

  const [goldRate, setGoldRate] = useState(0);
  const [silverRate, setSilverRate] = useState(0);

  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    if (open) {
      setOrnaments([]);
      setProofDocuments([]);
      setShowOrnamentForm(false);
      setShowProofForm(false);
      setOrnamentValues({ ornamentType: '', quantity: '', grossWeight: '', stoneWeight: '', netWeight: '', purity: '', netAmount: '' });
      setProofValues({ documentType: '', documentNo: '', documentFile: '' });

      if (auth.user?.branch?.address?.state) {
        getGoldRateByState({
          state: auth.user.branch.address.state,
          type: 'gold',
          date: moment().format('YYYY-MM-DD'),
        }).then((data) => {
          if (data.status) setGoldRate(data.data?.rate || 0);
        });
        getGoldRateByState({
          state: auth.user.branch.address.state,
          type: 'silver',
          date: moment().format('YYYY-MM-DD'),
        }).then((data) => {
          if (data.status) setSilverRate(data.data?.rate || 0);
        });
      }
    }
  }, [open, auth.user?.branch?.address?.state]);

  useEffect(() => {
    const { ornamentType, grossWeight, stoneWeight, purity } = ornamentValues;
    if (!ornamentType && !grossWeight && !stoneWeight && !purity) {
      return;
    }

    const isSilver = ['Anklets', 'Toe Ring'].includes(ornamentType);
    const rate = isSilver ? silverRate : goldRate;
    const gWt = parseFloat(grossWeight) || 0;
    const sWt = parseFloat(stoneWeight) || 0;
    const pVal = parseFloat(purity) || 0;

    const calculatedNetWeight = Math.max(0, gWt - sWt);
    const calculatedNetAmount = Math.round(((calculatedNetWeight * pVal) / 100) * rate);

    if (
      calculatedNetWeight !== parseFloat(ornamentValues.netWeight) ||
      calculatedNetAmount !== parseFloat(ornamentValues.netAmount)
    ) {
      setOrnamentValues((prev) => ({
        ...prev,
        netWeight: calculatedNetWeight || '',
        netAmount: calculatedNetAmount || '',
      }));
    }
  }, [
    ornamentValues.ornamentType,
    ornamentValues.grossWeight,
    ornamentValues.stoneWeight,
    ornamentValues.purity,
    goldRate,
    silverRate,
    ornamentValues.netWeight,
    ornamentValues.netAmount,
  ]);

  const schema = Yup.object({
    amount: Yup.number().required('Amount is required'),
    comments: Yup.string().required('Comments are required'),
    isCompleted: Yup.boolean(),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setFieldValue } = useFormik({
    initialValues: {
      amount: '',
      comments: '',
      isCompleted: true,
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      setLoading(true);
      
      const payload = {};
      // Assignee marks the release as complete
      if (type === 'release_complete') {
        payload.assigneeAmount = values.amount;
        payload.assigneeComments = values.comments;
        payload.proofDocuments = proofDocuments;
        payload.ornaments = ornaments;
        payload.status = 'completed';
      }

      updateRelease(id, payload).then((data) => {
        setLoading(false);
        if (data.status) {
          handleCloseVerifyModal();
          fetchData();
        }
      });
    },
  });

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setUploading(true);
      const uploadedList = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append('uploadedFile', file);
        formData.append('uploadName', file.name);
        formData.append('uploadId', id);
        try {
          const res = await createFile(formData);
          if (res.status) {
            uploadedList.push({
              name: file.name,
              url: res.data.uploadedFile,
            });
          }
        } catch (error) {
          console.error('File upload failed:', error);
        }
      }
      setSelectedFiles((prev) => [...prev, ...uploadedList]);
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onClose={handleCloseVerifyModal} maxWidth="lg" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: '#fff', mb: 2 }}>
          {sentenceCase(type || '')} Verification
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={5}>
              <Typography variant="h6" gutterBottom color="primary">Payment Info</Typography>
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
                sx={{ mb: 2 }}
              />
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
                rows={4}
              />
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h6" color="primary">Proof Documents</Typography>
                <Button variant="contained" size="small" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => setShowProofForm(!showProofForm)}>
                   {showProofForm ? 'Hide' : 'Add'}
                </Button>
              </Stack>
              
              {showProofForm && (
                <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2, bgcolor: '#f9f9f9' }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Document Type</InputLabel>
                        <Select
                          value={proofValues.documentType}
                          onChange={(e) => setProofValues({ ...proofValues, documentType: e.target.value })}
                          label="Document Type"
                        >
                           <MenuItem value="Ornaments Photo">Ornaments Photo</MenuItem>
                           <MenuItem value="Purchase bill">Purchase bill</MenuItem>
                           <MenuItem value="Pledge Receipt">Pledge Receipt</MenuItem>
                           <MenuItem value="Interest slip">Interest slip</MenuItem>
                           <MenuItem value="Release Copy">Release Copy</MenuItem>
                           {/* <MenuItem value="others">others</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Document No"
                        size="small"
                        value={proofValues.documentNo}
                        onChange={(e) => setProofValues({ ...proofValues, documentNo: e.target.value })}
                        fullWidth
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          style={{ fontSize: '12px' }}
                          disabled={uploading}
                        />
                      </Stack>
                    </Grid>
                    {uploading && (
                      <Grid item xs={12}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CircularProgress size={16} />
                          <Typography variant="caption" color="text.secondary">
                            Uploading files...
                          </Typography>
                        </Stack>
                      </Grid>
                    )}
                    {selectedFiles.length > 0 && (
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Selected Files ({selectedFiles.length}):
                        </Typography>
                        <Stack spacing={1} sx={{ mb: 2 }}>
                          {selectedFiles.map((file, idx) => {
                            const isImage = file.url?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);
                            const src = file.url?.startsWith('http') ? file.url : `${global.baseURL}/${file.url}`;
                            return (
                              <Stack
                                key={idx}
                                direction="row"
                                alignItems="center"
                                spacing={1.5}
                                sx={{
                                  p: 1,
                                  px: 2,
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  bgcolor: '#f8fafc',
                                }}
                              >
                                {isImage ? (
                                  <img
                                    src={src}
                                    alt={file.name}
                                    style={{ width: '30px', height: '30px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                  />
                                ) : (
                                  <img src="/assets/doc.svg" alt="doc" style={{ width: '28px', height: '28px' }} />
                                )}
                                <Typography variant="body2" sx={{ flexGrow: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontWeight: 500, color: '#334155' }}>
                                  {file.name}
                                </Typography>
                                {file.url && (
                                  <IconButton
                                    component="a"
                                    href={src}
                                    target="_blank"
                                    rel="noreferrer"
                                    color="primary"
                                    size="small"
                                    title="Preview File"
                                    sx={{ bgcolor: '#fff', border: '1px solid #cbd5e1' }}
                                  >
                                    <Iconify icon="mdi:eye" width={16} height={16} />
                                  </IconButton>
                                )}
                                <IconButton
                                  color="error"
                                  size="small"
                                  title="Remove File"
                                  sx={{ bgcolor: '#fff', border: '1px solid #fecaca' }}
                                  onClick={() => {
                                    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  <Iconify icon="mdi:delete" width={16} height={16} />
                                </IconButton>
                              </Stack>
                            );
                          })}
                        </Stack>
                      </Grid>
                    )}
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="small"
                        disabled={uploading || selectedFiles.length === 0 || !proofValues.documentType}
                        onClick={() => {
                          if (proofValues.documentType && selectedFiles.length > 0) {
                            const newDocs = selectedFiles.map((f) => ({
                              documentType: proofValues.documentType,
                              documentNo: proofValues.documentNo,
                              documentFile: f.url,
                            }));
                            setProofDocuments([...proofDocuments, ...newDocs]);
                            setProofValues({ documentType: '', documentNo: '', documentFile: '' });
                            setSelectedFiles([]);
                            setShowProofForm(false);
                          }
                        }}
                      >
                        Add Document
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}

              <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Document Type</TableCell>
                        <TableCell>Document No</TableCell>
                        <TableCell>File</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proofDocuments.map((doc, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{doc.documentType}</TableCell>
                          <TableCell>{doc.documentNo}</TableCell>
                          <TableCell>
                             {doc.documentFile && doc.documentFile !== 'undefined' ? (
                               <Link href={doc.documentFile} target="_blank" variant="caption">View</Link>
                             ) : (
                               <Typography variant="caption" color="text.disabled">No File</Typography>
                             )}
                          </TableCell>
                          <TableCell>
                            <IconButton color="error" size="small" onClick={() => setProofDocuments(proofDocuments.filter((_, i) => i !== idx))}>
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {proofDocuments.length === 0 && (
                        <TableRow><TableCell colSpan={4} align="center">No documents</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
              </TableContainer>
            </Grid>

            {(type === 'assignee' || type === 'release_complete') && (
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6" color="primary">Add Ornaments</Typography>
                  <Button variant="contained" size="small" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => setShowOrnamentForm(!showOrnamentForm)}>
                    {showOrnamentForm ? 'Hide Form' : 'Add New'}
                  </Button>
                </Stack>

                {showOrnamentForm && (
                  <Box sx={{ p: 2, border: '1px dashed #ccc', borderRadius: 1, mb: 2, bgcolor: '#f9f9f9' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                      Today's Rates - Gold: <b>₹{goldRate}</b> | Silver: <b>₹{silverRate}</b>
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Ornament Type</InputLabel>
                          <Select
                            value={ornamentValues.ornamentType}
                            onChange={(e) => setOrnamentValues({ ...ornamentValues, ornamentType: e.target.value })}
                            label="Ornament Type"
                          >
                             <MenuItem value="22 Carat Bar (91.6)">22 Carat Bar (91.6)</MenuItem> */}
                             <MenuItem value="24 Carat Bar (99.9)">24 Carat Bar (99.9)</MenuItem>
                             <MenuItem value="22 Carat Coin (91.6)">22 Carat Coin (91.6)</MenuItem>
                             <MenuItem value="24 Carat Coin (99.9)">24 Carat Coin (99.9)</MenuItem>
                             <MenuItem value="Anklets">Anklets</MenuItem>
                             <MenuItem value="Baby Bangles">Baby Bangles</MenuItem>
                             <MenuItem value="Bangles">Bangles</MenuItem>
                             <MenuItem value="Bracelet">Bracelet</MenuItem>
                             <MenuItem value="Broad Bangles">Broad Bangles</MenuItem>
                             <MenuItem value="Chain">Chain</MenuItem>
                             <MenuItem value="Chain with Locket">Chain with Locket</MenuItem>
                             <MenuItem value="Drops">Drops</MenuItem>
                             <MenuItem value="Ear Rings">Ear Rings</MenuItem>
                             <MenuItem value="Melted Bar">Melted Bar</MenuItem>
                             <MenuItem value="Locket">Locket</MenuItem>
                             <MenuItem value="Matti">Matti</MenuItem>
                             <MenuItem value="Necklace">Necklace</MenuItem>
                             <MenuItem value="Ring">Ring</MenuItem>
                             <MenuItem value="Studs">Studs</MenuItem>
                             <MenuItem value="Studs with drops">Studs with drops</MenuItem>
                             <MenuItem value="Thali Chain">Thali Chain</MenuItem>
                             <MenuItem value="Toe Ring">Toe Ring</MenuItem>
                             <MenuItem value="Waist Belt/Chain">Waist Belt/Chain</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField label="Qty" size="small" type="number" value={ornamentValues.quantity} onChange={(e) => setOrnamentValues({ ...ornamentValues, quantity: e.target.value })} fullWidth />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField label="Gross Wt" size="small" type="number" value={ornamentValues.grossWeight} onChange={(e) => setOrnamentValues({ ...ornamentValues, grossWeight: e.target.value })} fullWidth />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField label="Stone Wt" size="small" type="number" value={ornamentValues.stoneWeight} onChange={(e) => setOrnamentValues({ ...ornamentValues, stoneWeight: e.target.value })} fullWidth />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField
                          label="Net Wt"
                          size="small"
                          type="number"
                          value={ornamentValues.netWeight}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <TextField label="Purity" size="small" type="number" value={ornamentValues.purity} onChange={(e) => setOrnamentValues({ ...ornamentValues, purity: e.target.value })} fullWidth />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          label="Net Amount"
                          size="small"
                          type="number"
                          value={ornamentValues.netAmount}
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Button variant="contained" fullWidth onClick={() => {
                          if (ornamentValues.ornamentType && ornamentValues.netWeight) {
                            setOrnaments([...ornaments, ornamentValues]);
                            setOrnamentValues({ ornamentType: '', quantity: '', grossWeight: '', stoneWeight: '', netWeight: '', purity: '', netAmount: '' });
                            setShowOrnamentForm(false);
                          }
                        }}>Add</Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}

                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Type</TableCell>
                        <TableCell>Qty</TableCell>
                        <TableCell>Net Wt</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ornaments.map((orn, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{orn.ornamentType}</TableCell>
                          <TableCell>{orn.quantity}</TableCell>
                          <TableCell>{orn.netWeight}</TableCell>
                          <TableCell>{orn.netAmount}</TableCell>
                          <TableCell>
                            <IconButton color="error" size="small" onClick={() => setOrnaments(ornaments.filter((_, i) => i !== idx))}>
                              <Iconify icon="eva:trash-2-outline" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {ornaments.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center">No ornaments added</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            )}

            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                <Checkbox
                  name="isCompleted"
                  checked={values.isCompleted}
                  onChange={handleChange}
                />
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>Mark as completed (Moves to next stage)</Typography>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseVerifyModal} variant="outlined" color="inherit">Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ minWidth: 200 }}>
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

function ViewReleaseModal({ open, id, handleClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id && open) {
      setLoading(true);
      getReleaseById(id).then((res) => {
        setLoading(false);
        if (res.status) {
          setData(res.data);
        }
      });
    }
  }, [id, open]);

  if (!data) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Release Details</DialogTitle>
      <DialogContent sx={{ mt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Pledge Id</Typography>
              <Typography variant="body1">{data.pledgeId}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Customer</Typography>
              <Typography variant="body1">{data.customer?.name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Pledge Amount</Typography>
              <Typography variant="body1">₹{data.pledgeAmount}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Payable Amount</Typography>
              <Typography variant="body1">₹{data.payableAmount}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Pledged Date</Typography>
              <Typography variant="body1">{moment(data.pledgedDate).format('YYYY-MM-DD')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Release Date</Typography>
              <Typography variant="body1">{moment(data.releaseDate).format('YYYY-MM-DD')}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Pledged In</Typography>
              <Typography variant="body1">{data.pledgedIn}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">Payment Type</Typography>
              <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{data.paymentType}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" color="text.secondary">Comments</Typography>
              <Typography variant="body1">{data.comments || 'No comments'}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, display: 'block', fontWeight: 'bold' }}>Verification Status</Typography>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>Current Status: {data.status}</Typography>
            </Grid>
          </Grid>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
}

ViewReleaseModal.propTypes = {
  open: PropTypes.bool,
  id: PropTypes.string,
  handleClose: PropTypes.func,
};





