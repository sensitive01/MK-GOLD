import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
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
import { createFile } from '../../apis/branch/fileupload';
import global from '../../utils/global';

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
  const userType = auth.user?.userType;

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deviation, setDeviation] = useState('no');
  const [adminNotes, setAdminNotes] = useState('');
  const [adminProof, setAdminProof] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');

  const handleCloseDeleteModal = () => {
    setOpenDeleteModal(false);
  };

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
    </>
  );
}
