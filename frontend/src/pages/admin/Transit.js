import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    TextField
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import { useSelector } from 'react-redux';
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import { findTransit, updateTransitStatus, deleteTransitById } from '../../apis/admin/transit';
import { createTransit } from '../../apis/branch/transit';
import { createFile } from '../../apis/branch/fileupload';
import { findSales } from '../../apis/admin/sales';
import global from '../../utils/global';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LoadingButton } from '@mui/lab';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import Grid from '@mui/material/Grid';

const TABLE_HEAD = [
  { id: 'branch', label: 'Branch', alignRight: false },
  { id: 'transitId', label: 'Transit ID', alignRight: false },
  { id: 'numberOfPackets', label: 'Packets', alignRight: false },
  { id: 'physical', label: 'Physical', alignRight: false },
  { id: 'released', label: 'Released', alignRight: false },
  { id: 'totalNetWeight', label: 'Net Weight', alignRight: false },
  { id: 'deliveryBy', label: 'Delivery By', alignRight: false },
  { id: 'status', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: '' },
];

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
    return filter(array, (row) => row?.transitId?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Transit() {
  const auth = useSelector((state) => state.auth);
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const [adminNotes, setAdminNotes] = useState('');
  const [deviation, setDeviation] = useState('no');
  const [adminProof, setAdminProof] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef();

  const userType = auth?.user?.userType?.toLowerCase();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const createTransitMode = searchParams.get('createTransit') === 'true';
  const saleIdsString = searchParams.get('saleIds');
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [prefillData, setPrefillData] = useState(null);

  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleDelete = async () => {
    handleCloseDeleteModal();
    setOpenBackdrop(true);
    try {
      const res = await deleteTransitById(openId);
      if (res?.status) {
        setNotify({ open: true, message: 'Transit deleted successfully!', severity: 'success' });
        fetchData();
        setSelected([]);
      } else {
        setNotify({ open: true, message: res?.message || 'Error deleting transit', severity: 'error' });
        setOpenBackdrop(false);
      }
    } catch (error) {
      setNotify({ open: true, message: 'An error occurred', severity: 'error' });
      setOpenBackdrop(false);
    }
  };

  const fetchData = useCallback(
    (
      query = {
        createdAt: {
          $gte: moment()?.subtract(1, 'month').format("YYYY-MM-DD"),
          $lte: moment()?.add(1, 'days').format("YYYY-MM-DD"),
        },
      }
    ) => {
      findTransit(query).then((data) => {
        setData(data.data || []);
        setOpenBackdrop(false);
      });
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (createTransitMode && saleIdsString) {
      const saleIdsArray = saleIdsString.split(',');
      findSales({ _id: { $in: saleIdsArray } }).then((res) => {
        if (res.data?.length > 0) {
          const sales = res.data;
          
          let totalNetWeight = 0;
          let totalGrossWeight = 0;
          let numberOfOrnaments = 0;
          let physicalCount = 0;
          let releaseCount = 0;
          let minEndDate = null;
          let maxEndDate = null;

          sales.forEach((sale) => {
            totalNetWeight += Number(sale.netWeight || 0);
            totalGrossWeight += sale.ornaments?.reduce((acc, curr) => acc + (Number(curr.grossWeight) || 0), 0) || 0;
            numberOfOrnaments += sale.ornaments?.reduce((acc, curr) => acc + (Number(curr.quantity) || 1), 0) || 0;
            if (sale.saleType === 'physical') {
              physicalCount++;
            } else if (sale.saleType === 'release' || sale.saleType === 'pledged') {
              releaseCount++;
            }
            
            const endDate = moment(sale.updatedAt);
            if (!minEndDate || endDate.isBefore(minEndDate)) {
              minEndDate = endDate;
            }
            if (!maxEndDate || endDate.isAfter(maxEndDate)) {
              maxEndDate = endDate;
            }
          });

          setPrefillData({
            saleIds: saleIdsArray,
            totalNetWeight: totalNetWeight.toFixed(3),
            totalGrossWeight: totalGrossWeight.toFixed(3),
            numberOfOrnaments: numberOfOrnaments,
            numberOfPackets: sales.length,
            physical: physicalCount,
            released: releaseCount,
            fromDate: minEndDate ? minEndDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            toDate: maxEndDate ? maxEndDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
            branch: sales[0]?.branch?._id || sales[0]?.branch,
          });
          setOpenCreateModal(true);
          setSearchParams({});
        }
      });
    }
  }, [createTransitMode, saleIdsString, setSearchParams]);

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

  const handleUpdateStatus = () => {
    if (!adminProof) {
      setNotify({ open: true, message: 'Proof is required to receive transit', severity: 'error' });
      return;
    }
    const proofId = typeof adminProof === 'object' ? adminProof._id : adminProof;
    const newStatus = deviation === 'yes' ? 'moved' : 'submitted';
    updateTransitStatus(openId, { status: newStatus, deviations: deviation, receivedNotes: adminNotes, receivedProof: proofId }).then((data) => {
      handleCloseMenu();
      setViewModalOpen(false);
      if (data.status) {
        fetchData();
        setNotify({ open: true, message: `Transit status updated to ${newStatus}`, severity: 'success' });
      } else {
        setNotify({ open: true, message: data.message || 'Error updating status', severity: 'error' });
      }
    });
  };

  function AlertComponent(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  }

  const Alert = forwardRef(AlertComponent);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'transit_received_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const response = await createFile(formData);
      setUploadLoading(false);
      if (response.status) {
        setAdminProof(response.data?._id);
        setNotify({ open: true, message: 'Proof uploaded successfully', severity: 'success' });
      } else {
        alert('File upload failed');
      }
    }
  };

  const selectedTransitObj = data?.find(item => item._id === openId);

  return (
    <>
      <Helmet>
        <title> Transit | MK Gold </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={notify.open}
        onClose={() => setNotify({ ...notify, open: false })}
        autoHideDuration={3000}
      >
        <Alert
          onClose={() => setNotify({ ...notify, open: false })}
          severity={notify.severity}
          sx={{ width: '100%', color: 'white' }}
        >
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Transit Management
          </Typography>
          {userType === 'melting' && (
            <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={() => navigate('/melting/sale?selectForTransit=true')}>
              New Transit
            </Button>
          )}
        </Stack>

        <Card>
          <TransitListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TransitListHead
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
                      branch,
                      transitId,
                      numberOfPackets,
                      physical,
                      released,
                      totalNetWeight,
                      deliveryBy,
                      status,
                      createdAt,
                    } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                        </TableCell>
                        <TableCell align="left">{branch?.branchName || 'N/A'}</TableCell>
                        <TableCell align="left">{transitId}</TableCell>
                        <TableCell align="left">{numberOfPackets}</TableCell>
                        <TableCell align="left">{physical}</TableCell>
                        <TableCell align="left">{released}</TableCell>
                        <TableCell align="left">{totalNetWeight}</TableCell>
                        <TableCell align="left">{sentenceCase(deliveryBy || '')}</TableCell>
                        <TableCell align="left">
                          <Label color={status === 'received' ? 'success' : 'warning'}>{sentenceCase(status || '')}</Label>
                        </TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD')}</TableCell>
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
                      <TableCell colSpan={10} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 3 }}>
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
                      <TableCell align="center" colSpan={10} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
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
          sx: { p: 1, width: 140, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } },
        }}
      >
        <MenuItem
          onClick={() => {
            handleCloseMenu();
            setDeviation(selectedTransitObj?.deviations || 'no');
            setAdminNotes(selectedTransitObj?.receivedNotes || '');
            setAdminProof(selectedTransitObj?.receivedProof || '');
            setViewModalOpen(true);
          }}
        >
          <Iconify icon={'carbon:view-filled'} sx={{ mr: 2 }} />
          View Sale
        </MenuItem>

        <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleCloseMenu(); setDeleteType('single'); setOpenDeleteModal(true); }}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>

      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>View Transit Details</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Notes:
            </Typography>
            <Typography variant="body2" sx={{ mb: 3 }}>
              {selectedTransitObj?.notes || 'No notes provided.'}
            </Typography>
            <Typography variant="subtitle1" gutterBottom>
              Proof:
            </Typography>
            {selectedTransitObj?.proof?.uploadedFile ? (
              <Box component="img" src={selectedTransitObj.proof.uploadedFile.startsWith('http') ? selectedTransitObj.proof.uploadedFile : `${global.BASE_URL}/${selectedTransitObj.proof.uploadedFile}`} alt="proof" sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', mb: 3 }} />
            ) : (
              <Typography variant="body2" sx={{ mb: 3 }}>
                No proof uploaded.
              </Typography>
            )}
            <Typography variant="h6" gutterBottom sx={{ mt: 3, borderTop: '1px solid #ccc', pt: 2 }}>
              Received Details
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Admin Notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              sx={{ mt: 2 }}
            />
            <Button
              variant="contained"
              component="label"
              sx={{ mt: 2, mb: 1 }}
              disabled={uploadLoading}
            >
              {uploadLoading ? 'Uploading...' : 'Upload Proof'}
              <input
                type="file"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            {adminProof && typeof adminProof === 'object' && adminProof.uploadedFile ? (
              <Box component="img" src={adminProof.uploadedFile.startsWith('http') ? adminProof.uploadedFile : `${global.BASE_URL}/${adminProof.uploadedFile}`} alt="Admin proof" sx={{ width: '100%', maxHeight: 400, objectFit: 'contain', mb: 3, mt: 2 }} />
            ) : adminProof ? (
              <Typography variant="body2" sx={{ color: 'success.main', mb: 2 }}>
                Proof uploaded successfully!
              </Typography>
            ) : null}

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="deviations-label">Deviations</InputLabel>
              <Select
                labelId="deviations-label"
                value={deviation}
                label="Deviations"
                onChange={(e) => setDeviation(e.target.value)}
              >
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus} variant="contained" color="primary">
            Received
          </Button>
        </DialogActions>
      </Dialog>

      <Modal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
      >
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 }}>
          <Typography variant="h6" component="h2">
            Delete Transit
          </Typography>
          <Typography sx={{ mt: 3 }}>
            Do you want to delete this transit record?
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="outlined" onClick={handleCloseDeleteModal}>
              Cancel
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      {openCreateModal && (
        <CreateTransitModal 
          open={openCreateModal} 
          handleClose={() => setOpenCreateModal(false)} 
          fetchData={fetchData} 
          auth={auth} 
          setNotify={setNotify} 
          prefillData={prefillData}
        />
      )}
    </>
  );
}

function CreateTransitModal({ open, handleClose, fetchData, auth, setNotify, prefillData }) {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  const schema = Yup.object({
    saleIds: Yup.array().min(1, 'At least one Sale ID is required').required('Sale IDs are required'),
    transitId: Yup.string().required('Transit ID is required'),
    numberOfPackets: Yup.number().required('Number of packets is required'),
    physical: Yup.number().required('Physical is required'),
    released: Yup.number().required('Released is required'),
    numberOfOrnaments: Yup.number().required('Number of ornaments is required'),
    totalGrossWeight: Yup.number().required('Total gross weight is required'),
    totalNetWeight: Yup.number().required('Total net weight is required'),
    fromDate: Yup.date().required('From date is required'),
    toDate: Yup.date().required('To date is required'),
    numberOfDays: Yup.number().required('Number of days is required'),
    packetWeight: Yup.number().required('Packet weight is required'),
    deliveryBy: Yup.string().required('Delivery by is required'),
    notes: Yup.string(),
    proof: Yup.string().required('Proof is required'),
  });

  const { handleSubmit, handleChange, handleBlur, touched, errors, values, setFieldValue, resetForm, setValues, submitCount } = useFormik({
    initialValues: {
      saleIds: [],
      transitId: '',
      numberOfPackets: '',
      physical: '',
      released: '',
      numberOfOrnaments: '',
      totalGrossWeight: '',
      totalNetWeight: '',
      fromDate: moment(),
      toDate: moment(),
      numberOfDays: '',
      packetWeight: '',
      deliveryBy: '',
      notes: '',
      proof: '',
    },
    validationSchema: schema,
    onSubmit: (values) => {
      setLoading(true);
      const payload = { ...values, branch: auth.user?.branch?._id || auth.user?.branch || prefillData?.branch, createdBy: auth.user?._id, status: 'intransit' };
      createTransit(payload).then((data) => {
        setLoading(false);
        if (data.status) {
          handleClose();
          fetchData();
          resetForm();
          setNotify({ open: true, message: 'Transit created successfully', severity: 'success' });
        } else {
          setNotify({ open: true, message: data.message || 'Error creating transit', severity: 'error' });
        }
      });
    },
  });

  useEffect(() => {
    if (prefillData && open) {
      setValues((prev) => ({
        ...prev,
        saleIds: prefillData.saleIds || [],
        numberOfPackets: prefillData.numberOfPackets !== undefined ? prefillData.numberOfPackets : '',
        physical: prefillData.physical !== undefined ? prefillData.physical : '',
        released: prefillData.released !== undefined ? prefillData.released : '',
        numberOfOrnaments: prefillData.numberOfOrnaments || '',
        totalGrossWeight: prefillData.totalGrossWeight || '',
        totalNetWeight: prefillData.totalNetWeight || '',
        fromDate: prefillData.fromDate ? moment(prefillData.fromDate) : moment(),
        toDate: prefillData.toDate ? moment(prefillData.toDate) : moment(),
      }));
    }
  }, [prefillData, open, setValues]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      const formData = new FormData();
      formData.append('uploadedFile', file);
      formData.append('uploadName', 'transit_proof');
      formData.append('uploadId', [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
      const response = await createFile(formData);
      setLoading(false);
      if (response.status) {
        setFieldValue('proof', response.data?._id);
      } else {
        alert('File upload failed');
      }
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create Transit</DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {submitCount > 0 && Object.keys(errors).length > 0 && (
            <Box mb={3}>
              <MuiAlert severity="error">
                Please fix the following errors: {Object.values(errors).join(', ')}
              </MuiAlert>
            </Box>
          )}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField name="transitId" label="Transit ID" value={values.transitId} onChange={handleChange} onBlur={handleBlur} error={touched.transitId && !!errors.transitId} helperText={touched.transitId && errors.transitId} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="numberOfPackets" type="number" label="Number of Packets" value={values.numberOfPackets} onChange={handleChange} onBlur={handleBlur} error={touched.numberOfPackets && !!errors.numberOfPackets} helperText={touched.numberOfPackets && errors.numberOfPackets} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="physical" type="number" label="Physical" value={values.physical} onChange={handleChange} onBlur={handleBlur} error={touched.physical && !!errors.physical} helperText={touched.physical && errors.physical} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="released" type="number" label="Released" value={values.released} onChange={handleChange} onBlur={handleBlur} error={touched.released && !!errors.released} helperText={touched.released && errors.released} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="numberOfOrnaments" type="number" label="Number of Ornaments" value={values.numberOfOrnaments} onChange={handleChange} onBlur={handleBlur} error={touched.numberOfOrnaments && !!errors.numberOfOrnaments} helperText={touched.numberOfOrnaments && errors.numberOfOrnaments} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="totalGrossWeight" type="number" label="Total Gross Weight" value={values.totalGrossWeight} onChange={handleChange} onBlur={handleBlur} error={touched.totalGrossWeight && !!errors.totalGrossWeight} helperText={touched.totalGrossWeight && errors.totalGrossWeight} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="totalNetWeight" type="number" label="Total Net Weight" value={values.totalNetWeight} onChange={handleChange} onBlur={handleBlur} error={touched.totalNetWeight && !!errors.totalNetWeight} helperText={touched.totalNetWeight && errors.totalNetWeight} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker label="From Date" inputFormat="MM/DD/YYYY" value={values.fromDate} onChange={(v) => setFieldValue('fromDate', v)} renderInput={(params) => <TextField {...params} fullWidth error={touched.fromDate && !!errors.fromDate} helperText={touched.fromDate && errors.fromDate} />} />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <DesktopDatePicker label="To Date" inputFormat="MM/DD/YYYY" value={values.toDate} onChange={(v) => setFieldValue('toDate', v)} renderInput={(params) => <TextField {...params} fullWidth error={touched.toDate && !!errors.toDate} helperText={touched.toDate && errors.toDate} />} />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="numberOfDays" type="number" label="Number of Days" value={values.numberOfDays} onChange={handleChange} onBlur={handleBlur} error={touched.numberOfDays && !!errors.numberOfDays} helperText={touched.numberOfDays && errors.numberOfDays} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="packetWeight" type="number" label="Packet Weight" value={values.packetWeight} onChange={handleChange} onBlur={handleBlur} error={touched.packetWeight && !!errors.packetWeight} helperText={touched.packetWeight && errors.packetWeight} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="deliveryBy" label="Delivery By" value={values.deliveryBy} onChange={handleChange} onBlur={handleBlur} error={touched.deliveryBy && !!errors.deliveryBy} helperText={touched.deliveryBy && errors.deliveryBy} fullWidth />
            </Grid>
            <Grid item xs={12} sm={6}>
               <input type="file" style={{ display: 'none' }} ref={fileInputRef} accept="image/*,application/pdf" onChange={handleFileUpload} />
               <LoadingButton loading={loading} variant="outlined" onClick={() => fileInputRef.current?.click()} fullWidth color={touched.proof && !!errors.proof ? 'error' : 'primary'} sx={{ height: 56 }}>
                 {values.proof ? 'Proof Uploaded' : 'Upload Proof (Image/PDF)'}
               </LoadingButton>
            </Grid>
            <Grid item xs={12}>
              <TextField name="notes" label="Notes" value={values.notes} onChange={handleChange} onBlur={handleBlur} fullWidth multiline rows={3} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <LoadingButton type="submit" variant="contained" loading={loading} sx={{ color: '#fff' }}>Create</LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
}
