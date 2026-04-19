import { filter } from 'lodash';
import { forwardRef, useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
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
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
// components
import { CreateLead, UpdateLead, PreviewLead } from '../../components/branch/lead';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { AttendanceListHead, AttendanceListToolbar } from '../../sections/@dashboard/attendance';
// apis
import { deleteLeadById, getLeads } from '../../apis/branch/lead';
import global from '../../utils/global';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'Name', alignRight: false },
  { id: 'mobile', label: 'Mobile', alignRight: false },
  { id: 'category', label: 'Category', alignRight: false },
  { id: 'type', label: 'Type', alignRight: false },
  { id: 'attachment', label: 'Attachment', alignRight: false },
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
    return filter(array, (row) => row?.name?.toLowerCase().indexOf(query.toLowerCase()) !== -1);
  }
  return stabilizedThis?.map((el) => el[0]);
}

export default function Leads() {
  const auth = useSelector((state) => state.auth);
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

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    () => {
      getLeads({}).then((data) => {
        setData(data.data);
        setOpenBackdrop(false);
      });
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, toggleContainer]);

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
    deleteLeadById(openId).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected(selected?.filter((e) => e !== openId));
    });
  };

  const handleDeleteSelected = () => {
    deleteLeadById(selected).then(() => {
      fetchData();
      handleCloseDeleteModal();
      setSelected([]);
      setNotify({
        open: true,
        message: 'Leads deleted',
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
        <title> Leads | MK Gold </title>
      </Helmet>

      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={notify.open}
        onClose={() => setNotify({ ...notify, open: false })}
        autoHideDuration={3000}
      >
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity} sx={{ width: '100%', color: 'white' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      <Container maxWidth={false} sx={{ display: toggleContainer === true ? 'none' : 'block' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Leads Management
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => {
              setToggleContainer(true);
              setToggleContainerType('create');
            }}
          >
            New Lead
          </Button>
        </Stack>

        <Card>
          <AttendanceListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
          />

          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <AttendanceListHead
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
                    const { _id, name, mobile, category, type, status, createdAt, lead } = row;
                    const selectedData = selected.indexOf(_id) !== -1;

                    return (
                      <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                        <TableCell padding="checkbox">
                          <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                        </TableCell>
                        <TableCell align="left">{name}</TableCell>
                        <TableCell align="left">{global.maskPhoneNumber(mobile)}</TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>{category}</TableCell>
                        <TableCell align="left" sx={{ textTransform: 'capitalize' }}>{type}</TableCell>
                        <TableCell align="left">
                          {lead?.uploadedFile ? (
                            <img
                              src={lead.uploadedFile.startsWith('http') ? lead.uploadedFile : `${global.baseURL}/${lead.uploadedFile}`}
                              alt="lead"
                              style={{ width: '80px', borderRadius: '4px' }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </TableCell>
                        <TableCell align="left">
                           <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: status === 'pending' ? 'warning.main' : status === 'converted' ? 'success.main' : 'error.main', color: '#fff', width: 'fit-content', textTransform: 'capitalize' }}>
                             {status}
                           </Box>
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
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                  {filteredData?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={7} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No leads found</Typography>
                        </Paper>
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
            count={data?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {toggleContainer === true && toggleContainerType === 'preview' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Preview Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <PreviewLead setToggleContainer={setToggleContainer} id={openId} />
        </Container>
      )}

      {toggleContainer === true && toggleContainerType === 'create' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Create Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <CreateLead setToggleContainer={setToggleContainer} setNotify={setNotify} />
        </Container>
      )}

      {toggleContainer === true && toggleContainerType === 'update' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Update Lead
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <UpdateLead setToggleContainer={setToggleContainer} id={openId} setNotify={setNotify} />
        </Container>
      )}

      <Popover
        open={Boolean(open)}
        anchorEl={open}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { p: 1, width: 140, '& .MuiMenuItem-root': { px: 1, typography: 'body2', borderRadius: 0.75 } } }}
      >
        <MenuItem
           onClick={() => {
             setOpen(null);
             setToggleContainer(true);
             setToggleContainerType('preview');
           }}
        >
          <Iconify icon={'eva:eye-outline'} sx={{ mr: 2 }} />
          Preview
        </MenuItem>
        <MenuItem
           onClick={() => {
             setOpen(null);
             setToggleContainer(true);
             setToggleContainerType('update');
           }}
        >
          <Iconify icon={'eva:edit-outline'} sx={{ mr: 2 }} />
          Edit
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

      <Modal open={openDeleteModal} onClose={handleCloseDeleteModal}>
        <Box sx={style}>
          <Typography variant="h6">Delete</Typography>
          <Typography sx={{ mt: 3 }}>Are you sure you want to delete?</Typography>
          <Stack direction="row" spacing={2} mt={3}>
            <Button variant="contained" color="error" onClick={deleteType === 'single' ? handleDelete : handleDeleteSelected}>Delete</Button>
            <Button variant="contained" onClick={handleCloseDeleteModal}>Close</Button>
          </Stack>
        </Box>
      </Modal>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}





