import { forwardRef, useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Backdrop, Box, Button, Card, CircularProgress, Container, IconButton,
  MenuItem, Modal, Popover, Snackbar, Stack, Table, TableBody,
  TableCell, TableContainer, TableHead, TablePagination, TableRow,
  Typography, TextField, Paper
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
import { findVendor, createVendor, updateVendor, deleteVendor } from '../../apis/admin/vendor';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  borderRadius: 3,
  boxShadow: 24,
  p: 4,
};

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

export default function Vendor() {
  const [data, setData] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Menu
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  // Modals
  const [openForm, setOpenForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    vendorId: '',
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    gstNumber: '',
    address: '',
    city: '',
    state: ''
  });

  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setOpenBackdrop(true);
    findVendor().then((res) => {
      setData(res.data?.data || []);
      setOpenBackdrop(false);
    }).catch(() => setOpenBackdrop(false));
  };

  const handleOpenMenu = (event, id) => {
    setSelectedId(id);
    setOpenMenu(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setOpenMenu(null);
  };

  const handleOpenCreate = () => {
    setIsEdit(false);
    setFormData({
      vendorId: '', name: '', contactPerson: '', phoneNumber: '', email: '',
      gstNumber: '', address: '', city: '', state: ''
    });
    setOpenForm(true);
  };

  const handleOpenEdit = () => {
    const vendor = data.find(v => v._id === selectedId);
    if (vendor) {
      setFormData({ ...vendor });
      setIsEdit(true);
      setOpenForm(true);
    }
    handleCloseMenu();
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setOpenBackdrop(true);
    try {
      const res = isEdit 
        ? await updateVendor(selectedId, formData)
        : await createVendor(formData);
        
      if (res.data?.status) {
        setNotify({ open: true, message: res.data.message, severity: 'success' });
        setOpenForm(false);
        fetchData();
      } else {
        setNotify({ open: true, message: res.data?.message || 'Error', severity: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: 'Server error', severity: 'error' });
    } finally {
      setOpenBackdrop(false);
    }
  };

  const handleDelete = async () => {
    setOpenBackdrop(true);
    try {
      const res = await deleteVendor(selectedId);
      if (res.data?.status) {
        setNotify({ open: true, message: res.data.message, severity: 'success' });
        setOpenDelete(false);
        fetchData();
      } else {
        setNotify({ open: true, message: res.data?.message || 'Error', severity: 'error' });
      }
    } catch (err) {
      setNotify({ open: true, message: 'Server error', severity: 'error' });
    } finally {
      setOpenBackdrop(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <Helmet><title> Vendor | Admin </title></Helmet>

      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={notify.severity} sx={{ width: '100%', color: 'white' }}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" sx={{ color: '#fff' }}>Vendor Management</Typography>
          <Button variant="contained" startIcon={<Iconify icon="eva:plus-fill" />} onClick={handleOpenCreate}>
            New Vendor
          </Button>
        </Stack>

        <Card>
          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Vendor Name</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                    <TableRow hover key={row._id}>
                      <TableCell>{row.vendorId}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.contactPerson || 'N/A'}</TableCell>
                      <TableCell>{row.phoneNumber}</TableCell>
                      <TableCell>{row.city || 'N/A'}</TableCell>
                      <TableCell>{moment(row.createdAt).format('DD MMM YYYY')}</TableCell>
                      <TableCell align="right">
                        <IconButton size="large" onClick={(e) => handleOpenMenu(e, row._id)}>
                          <Iconify icon={'eva:more-vertical-fill'} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && !openBackdrop && (
                    <TableRow>
                      <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
                        <Typography variant="body1">No vendors found</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Card>
      </Container>

      {/* Popover Menu */}
      <Popover
        open={Boolean(openMenu)}
        anchorEl={openMenu}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 1, width: 140 } }}
      >
        <MenuItem onClick={handleOpenEdit}>
          <Iconify icon={'eva:edit-fill'} sx={{ mr: 2 }} /> Edit
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { handleCloseMenu(); setOpenDelete(true); }}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} /> Delete
        </MenuItem>
      </Popover>

      {/* Create/Edit Form Modal */}
      <Modal open={openForm} onClose={() => setOpenForm(false)}>
        <Box sx={{ ...style, width: 600 }}>
          <Typography variant="h6" mb={3}>{isEdit ? 'Edit Vendor' : 'Create Vendor'}</Typography>
          <form onSubmit={handleFormSubmit}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="Vendor ID (Auto-generated if empty)" name="vendorId" value={formData.vendorId || ''} onChange={handleChange} disabled={isEdit} />
                <TextField fullWidth required label="Vendor Name" name="name" value={formData.name || ''} onChange={handleChange} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth required label="Phone Number" name="phoneNumber" value={formData.phoneNumber || ''} onChange={handleChange} />
                <TextField fullWidth label="Contact Person" name="contactPerson" value={formData.contactPerson || ''} onChange={handleChange} />
              </Stack>
              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="Email" name="email" value={formData.email || ''} onChange={handleChange} />
                <TextField fullWidth label="GST Number" name="gstNumber" value={formData.gstNumber || ''} onChange={handleChange} />
              </Stack>
              <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} multiline rows={2} />
              <Stack direction="row" spacing={2}>
                <TextField fullWidth label="City" name="city" value={formData.city} onChange={handleChange} />
                <TextField fullWidth label="State" name="state" value={formData.state} onChange={handleChange} />
              </Stack>
              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
                <Button variant="outlined" onClick={() => setOpenForm(false)}>Cancel</Button>
                <Button variant="contained" type="submit">{isEdit ? 'Update' : 'Save'}</Button>
              </Stack>
            </Stack>
          </form>
        </Box>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={openDelete} onClose={() => setOpenDelete(false)}>
        <Box sx={style}>
          <Typography variant="h6">Delete Vendor</Typography>
          <Typography sx={{ mt: 2 }}>Are you sure you want to delete this vendor?</Typography>
          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
            <Button variant="outlined" onClick={() => setOpenDelete(false)}>Cancel</Button>
            <Button variant="contained" color="error" onClick={handleDelete}>Delete</Button>
          </Stack>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
