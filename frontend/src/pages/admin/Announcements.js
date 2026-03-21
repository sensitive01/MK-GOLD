import { Helmet } from 'react-helmet-async';
import { filter } from 'lodash';
import { useState, useEffect, forwardRef } from 'react';
// @mui
import {
  Card,
  Table,
  Stack,
  Paper,
  Avatar,
  Button,
  Popover,
  Checkbox,
  TableRow,
  TableBody,
  TableCell,
  Container,
  Typography,
  IconButton,
  TableContainer,
  TablePagination,
  Box,
  Snackbar,
  MenuItem,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
// components
import { CreateAnnouncement, UpdateAnnouncement } from '../../components/admin/announcement';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { UserListHead, UserListToolbar } from '../../sections/@dashboard/user';
import { deleteAnnouncementById, getAnnouncements } from '../../apis/admin/announcement';
import global from '../../utils/global';

const TABLE_HEAD = [
  { id: 'title', label: 'Title', alignRight: false },
  { id: 'targetUserType', label: 'Target', alignRight: false },
  { id: 'notificationType', label: 'Type', alignRight: false },
  { id: 'image', label: 'Image', alignRight: false },
  { id: 'expiryDate', label: 'Expiry', alignRight: false },
  { id: 'isActive', label: 'Status', alignRight: false },
  { id: '' },
];

const Alert = forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function Announcements() {
  const [open, setOpen] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState('title');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [data, setData] = useState([]);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('create');
  const [openId, setOpenId] = useState(null);
  const [notify, setNotify] = useState({ open: false, message: '', type: 'success' });

  const fetchData = () => {
    getAnnouncements().then((res) => {
      if (res.status) {
        setData(res.data);
      }
    });
  };

  useEffect(() => {
    fetchData();
  }, [toggleContainer]);

  const handleOpenMenu = (event, id) => {
    setOpenId(id);
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
      const newSelecteds = data.map((n) => n._id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
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

  const handleDelete = async () => {
    const res = await deleteAnnouncementById(openId);
    if (res.status) {
      setNotify({ open: true, message: 'Deleted Successfully!', type: 'success' });
      fetchData();
    } else {
      setNotify({ open: true, message: res.message, type: 'error' });
    }
    setOpen(null);
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - data.length) : 0;
  const filteredData = data.filter((item) =>
    item.title?.toLowerCase().includes(filterName.toLowerCase())
  );

  return (
    <>
      <Helmet>
        <title> Announcements Management | MK GOLD </title>
      </Helmet>

      <Snackbar
        open={notify.open}
        autoHideDuration={6000}
        onClose={() => setNotify({ ...notify, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.type} sx={{ width: '100%' }}>
          {notify.message}
        </Alert>
      </Snackbar>

      {toggleContainer === false && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Announcements Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => {
                setToggleContainer(true);
                setToggleContainerType('create');
              }}
            >
              New Announcement
            </Button>
          </Stack>

          <Card>
            <UserListToolbar
              numSelected={selected.length}
              filterName={filterName}
              onFilterName={handleFilterByName}
              placeholder="Search announcements..."
            />

            <Scrollbar>
              <TableContainer sx={{ minWidth: 800 }}>
                <Table>
                  <UserListHead
                    order={order}
                    orderBy={orderBy}
                    headLabel={TABLE_HEAD}
                    rowCount={data.length}
                    numSelected={selected.length}
                    onRequestSort={handleRequestSort}
                    onSelectAllClick={handleSelectAllClick}
                  />
                  <TableBody>
                    {filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                      const { _id, title, targetUserType, notificationType, isActive, expiryDate, file } = row;
                      const selectedData = selected.indexOf(_id) !== -1;

                      return (
                        <TableRow hover key={_id} tabIndex={-1} role="checkbox" selected={selectedData}>
                          <TableCell padding="checkbox">
                            <Checkbox checked={selectedData} onChange={(event) => handleClick(event, _id)} />
                          </TableCell>
                          <TableCell align="left">{title}</TableCell>
                          <TableCell align="left" sx={{ textTransform: 'capitalize' }}>{targetUserType}</TableCell>
                          <TableCell align="left" sx={{ textTransform: 'capitalize' }}>{notificationType}</TableCell>
                          <TableCell align="left">
                            {file?.uploadedFile ? (
                              <img
                                src={file.uploadedFile.startsWith('http') ? file.uploadedFile : `${global.baseURL}/${file.uploadedFile}`}
                                alt="ann"
                                style={{ width: '40px', borderRadius: '4px' }}
                              />
                            ) : (
                              'No Image'
                            )}
                          </TableCell>
                          <TableCell align="left">
                            {expiryDate ? moment(expiryDate).format('YYYY-MM-DD') : 'Never'}
                          </TableCell>
                          <TableCell align="left">
                             <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: isActive ? 'success.main' : 'error.main', color: '#fff', width: 'fit-content', textTransform: 'capitalize' }}>
                               {isActive ? 'Active' : 'Inactive'}
                             </Box>
                          </TableCell>
                          <TableCell align="right">
                            <IconButton size="large" color="inherit" onClick={(e) => handleOpenMenu(e, _id)}>
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
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Card>
        </Container>
      )}

      {toggleContainer === true && toggleContainerType === 'create' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Create Announcement
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <CreateAnnouncement setToggleContainer={setToggleContainer} setNotify={setNotify} />
        </Container>
      )}

      {toggleContainer === true && toggleContainerType === 'update' && (
        <Container maxWidth="xl">
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
              Update Announcement
            </Typography>
            <Button
              variant="contained"
              startIcon={<Iconify icon="mdi:arrow-left" />}
              onClick={() => setToggleContainer(false)}
            >
              Back
            </Button>
          </Stack>
          <UpdateAnnouncement setToggleContainer={setToggleContainer} setNotify={setNotify} id={openId} />
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
             setToggleContainerType('update');
           }}
        >
          <Iconify icon={'eva:edit-outline'} sx={{ mr: 2 }} />
          Edit
        </MenuItem>

        <MenuItem sx={{ color: 'error.main' }} onClick={handleDelete}>
          <Iconify icon={'eva:trash-2-outline'} sx={{ mr: 2 }} />
          Delete
        </MenuItem>
      </Popover>
    </>
  );
}

export default Announcements;
