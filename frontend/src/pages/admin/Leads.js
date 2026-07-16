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
    TableHead,
    TablePagination,
    TableRow,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import moment from 'moment';
import * as XLSX from 'xlsx';
// components
import { CreateLead, UpdateLead, PreviewLead } from '../../components/admin/lead';
import Iconify from '../../components/iconify';
import Scrollbar from '../../components/scrollbar';
// sections
import { AttendanceListHead } from '../../sections/@dashboard/attendance';
import LeadListToolbar from '../../sections/@dashboard/lead/LeadListToolbar';
import LeadFilterSidebar from '../../sections/@dashboard/lead/LeadFilterSidebar';
// apis
import { deleteLeadById, getLeads, markLeadsExclusive } from '../../apis/admin/lead';
// Note: importedLead API might not exist for Admin, but leaving as is unless it breaks.
import { getImportedLeads, importLeads, deleteImportedLead } from '../../apis/branch/importedLead';
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

function applyExclusiveFilter(array, isExclusiveFilter) {
  if (isExclusiveFilter && isExclusiveFilter !== 'all') {
    const exclusiveVal = isExclusiveFilter === 'exclusive';
    return array.filter((row) => !!row.isExclusive === exclusiveVal);
  }
  return array;
}

export default function Leads({ title = "Leads Management" }) {
  const auth = useSelector((state) => state.auth);
  const [open, setOpen] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('asc');
  const [selected, setSelected] = useState([]);
  const [orderBy, setOrderBy] = useState(null);
  const [filterName, setFilterName] = useState('');
  const [filterExclusive, setFilterExclusive] = useState('all');
  const [openFilter, setOpenFilter] = useState(false);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: 'all',
    category: 'all',
    type: 'all',
    isExclusive: 'all'
  });
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [toggleContainer, setToggleContainer] = useState(false);
  const [toggleContainerType, setToggleContainerType] = useState('');
  const [data, setData] = useState([]);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState('single');
  const handleOpenDeleteModal = () => setOpenDeleteModal(true);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const [openImportModal, setOpenImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isImportedLead, setIsImportedLead] = useState(false);
  const [showExclusiveTip, setShowExclusiveTip] = useState(true);

  const [notify, setNotify] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchData = useCallback(
    () => {
      setOpenBackdrop(true);
      Promise.all([getLeads({}), getImportedLeads()])
        .then(([leadsRes, importedRes]) => {
          const normalLeads = leadsRes.data || [];
          const importedLeads = (importedRes.status && importedRes.data) ? importedRes.data.map(item => ({
            ...item,
            mobile: item.phone, // map phone to mobile for table display
            category: 'Imported',
            status: 'pending',
            type: 'CSV',
            isImported: true,
          })) : [];
          setData([...normalLeads, ...importedLeads]);
          setOpenBackdrop(false);
        })
        .catch(() => {
          setOpenBackdrop(false);
        });
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData, toggleContainer]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      const nameLower = selectedFile.name.toLowerCase();
      const isCSV = selectedFile.type === 'text/csv' || nameLower.endsWith('.csv');
      const isExcel = nameLower.endsWith('.xlsx') || nameLower.endsWith('.xls');
      if (!isCSV && !isExcel) {
        setNotify({
          open: true,
          message: 'Please upload a valid CSV or Excel file.',
          severity: 'error',
        });
        return;
      }
      setImportFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target.result;
          const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          
          if (json.length === 0) {
            setNotify({
              open: true,
              message: 'The uploaded file is empty.',
              severity: 'warning',
            });
            return;
          }
          
          const mapped = json.map((row) => {
            const keys = Object.keys(row);
            const getVal = (possibleKeys) => {
              const matchedKey = keys.find(k => possibleKeys.includes(k.toLowerCase().trim()));
              return matchedKey ? String(row[matchedKey]).trim() : '';
            };
            
            return {
              name: getVal(['name', 'full name', 'lead name']),
              phone: getVal(['phone', 'phone number', 'mobile', 'mobile number']),
              email: getVal(['email', 'email address']),
              weight: parseFloat(getVal(['weight', 'qty', 'quantity'])) || 0,
              pincode: getVal(['pincode', 'pin', 'postal code']),
              comments: getVal(['comments', 'comment', 'remarks', 'remark', 'desc']),
            };
          });

          setImportPreview(mapped);
          setNotify({
            open: true,
            message: `Successfully parsed ${mapped.length} rows.`,
            severity: 'success',
          });
        } catch (error) {
          setNotify({
            open: true,
            message: 'Error parsing CSV file.',
            severity: 'error',
          });
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Name', 'Phone', 'Email', 'Weight', 'Comments', 'Pincode'];
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'leads_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSubmitImport = () => {
    if (importPreview.length === 0) {
      setNotify({
        open: true,
        message: 'No data to import.',
        severity: 'warning',
      });
      return;
    }

    setOpenBackdrop(true);
    importLeads({ leads: importPreview })
      .then((res) => {
        if (res.status) {
          setNotify({
            open: true,
            message: res.message || 'Leads imported successfully',
            severity: 'success',
          });
          setImportPreview([]);
          setImportFile(null);
          setOpenImportModal(false);
          fetchData();
        } else {
          setNotify({
            open: true,
            message: res.message || 'Failed to import leads',
            severity: 'error',
          });
          setOpenBackdrop(false);
        }
      })
      .catch((err) => {
        setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
        setOpenBackdrop(false);
      });
  };

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
  let filteredData = applySortFilter(data, getComparator(order, orderBy), filterName);
  
  if (filters.status && filters.status !== 'all') {
    filteredData = filteredData.filter((row) => row.status === filters.status);
  }
  if (filters.category && filters.category !== 'all') {
    filteredData = filteredData.filter((row) => row.category === filters.category);
  }
  if (filters.type && filters.type !== 'all') {
    filteredData = filteredData.filter((row) => row.type === filters.type);
  }
  if (filters.startDate) {
    const start = new Date(filters.startDate).getTime();
    filteredData = filteredData.filter((row) => row.date && new Date(row.date).getTime() >= start);
  }
  if (filters.endDate) {
    const end = new Date(filters.endDate).getTime();
    filteredData = filteredData.filter((row) => row.date && new Date(row.date).getTime() <= end);
  }
  
  filteredData = applyExclusiveFilter(filteredData, filters.isExclusive);
  const isNotFound = !filteredData?.length && !!filterName;

  const handleDelete = () => {
    if (isImportedLead) {
      deleteImportedLead(openId).then(() => {
        fetchData();
        handleCloseDeleteModal();
        setSelected(selected?.filter((e) => e !== openId));
      });
    } else {
      deleteLeadById(openId).then(() => {
        fetchData();
        handleCloseDeleteModal();
        setSelected(selected?.filter((e) => e !== openId));
      });
    }
  };

  const handleMarkExclusive = () => {
    const selectedRows = data.filter(item => selected.includes(item._id) && !item.isImported);
    const ids = selectedRows.map(item => item._id);
    if (ids.length === 0) return;
    
    const isAllExclusive = selectedRows.every(item => item.isExclusive);
    
    setOpenBackdrop(true);
    markLeadsExclusive({ ids, isExclusive: !isAllExclusive }).then((res) => {
      setOpenBackdrop(false);
      if (res?.status) {
        fetchData();
        setSelected([]);
        setNotify({
          open: true,
          message: isAllExclusive ? 'Leads unmarked as exclusive' : 'Leads marked as exclusive',
          severity: 'success',
        });
      }
    });
  };

  const handleDeleteSelected = () => {
    const selectedRows = data.filter(item => selected.includes(item._id));
    const normalIds = selectedRows.filter(item => !item.isImported).map(item => item._id);
    const importedIds = selectedRows.filter(item => item.isImported).map(item => item._id);

    const promises = [];
    if (normalIds.length > 0) {
      promises.push(deleteLeadById(normalIds));
    }
    if (importedIds.length > 0) {
      promises.push(deleteImportedLead(importedIds.join(',')));
    }

    Promise.all(promises).then(() => {
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
            {title}
          </Typography>
          <Stack direction="row" spacing={2}>
            {auth.user?.userType?.toLowerCase() === 'telecalling' && (
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<Iconify icon="eva:cloud-upload-fill" />}
                onClick={() => {
                  setImportFile(null);
                  setImportPreview([]);
                  setOpenImportModal(true);
                }}
                sx={{ color: '#fff', borderColor: '#fff', '&:hover': { borderColor: '#e1bee7', bgcolor: 'rgba(255,255,255,0.08)' } }}
              >
                Import Leads
              </Button>
            )}
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
        </Stack>

        {showExclusiveTip && (
          <MuiAlert severity="info" sx={{ mb: 3 }} onClose={() => setShowExclusiveTip(false)}>
            <strong>Tip:</strong> To mark leads as exclusive, check the boxes next to the leads and click the star (⭐️) icon above the table.
          </MuiAlert>
        )}

        <Card>
          <LeadListToolbar
            numSelected={selected?.length}
            filterName={filterName}
            onFilterName={handleFilterByName}
            handleDelete={() => {
              setDeleteType('selected');
              handleOpenDeleteModal();
            }}
            handleMarkExclusive={handleMarkExclusive}
            isAllExclusive={selected?.length > 0 && selected.every(id => data?.find(item => item._id === id)?.isExclusive)}
            filterComponent={
              <LeadFilterSidebar
                openFilter={openFilter}
                onOpenFilter={() => setOpenFilter(true)}
                onCloseFilter={() => setOpenFilter(false)}
                filters={filters}
                setFilters={setFilters}
              />
            }
          />

          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
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
                      <TableRow
                        hover
                        key={_id}
                        tabIndex={-1}
                        role="checkbox"
                        selected={selectedData}
                        onClick={() => {
                          setOpenId(_id);
                          setIsImportedLead(!!row.isImported);
                          setToggleContainer(true);
                          setToggleContainerType('preview');
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
                        <TableCell align="left">
                          {row.isExclusive && (
                            <Iconify icon="eva:star-fill" sx={{ color: 'warning.main', mr: 1, verticalAlign: 'text-bottom' }} />
                          )}
                          {name}
                        </TableCell>
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
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <IconButton
                            size="large"
                            color="inherit"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setOpenId(_id);
                              setIsImportedLead(!!row.isImported);
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
          {isImportedLead ? (
            <PreviewImportedLead data={data.find(item => item._id === openId)} />
          ) : (
            <PreviewLead setToggleContainer={setToggleContainer} id={openId} />
          )}
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
        {!isImportedLead && (
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
        )}
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

      <Dialog open={openImportModal} onClose={() => setOpenImportModal(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
          <Typography variant="h6" sx={{ color: '#8A1B9F', fontWeight: 'bold' }}>
            Import Leads via CSV
          </Typography>
          <Button
            variant="outlined"
            startIcon={<Iconify icon="eva:download-outline" />}
            onClick={handleDownloadTemplate}
            size="small"
            sx={{
              color: '#8A1B9F',
              borderColor: '#8A1B9F',
              fontWeight: 'bold',
              '&:hover': {
                borderColor: '#7B1FA2',
                bgcolor: 'rgba(138, 27, 159, 0.04)',
              }
            }}
          >
            Download Template
          </Button>
        </DialogTitle>
        <DialogContent
          sx={{
            p: 3,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Select a CSV or Excel file containing columns for <strong>Name, Phone, Email, Weight, Comments, Pincode</strong>.
            </Typography>
            <Typography variant="body2" color="textSecondary">
              All fields are optional.
            </Typography>
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #8A1B9F',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: 'rgba(138, 27, 159, 0.04)',
              transition: 'all 0.3s',
              width: '100%',
              boxSizing: 'border-box',
              '&:hover': {
                bgcolor: 'rgba(138, 27, 159, 0.08)',
                borderColor: '#b39ddb',
              },
            }}
            component="label"
          >
            <input type="file" accept=".csv, .xlsx, .xls" hidden onChange={handleFileChange} />
            <Iconify icon="eva:cloud-upload-fill" sx={{ fontSize: 48, color: '#8A1B9F', mb: 1 }} />
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              {importFile ? importFile.name : 'Click to select CSV or Excel File'}
            </Typography>
            <Typography variant="caption" color="textSecondary">
              Accepts CSV or Excel files up to 5MB
            </Typography>
          </Box>

          {importPreview.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#8A1B9F', fontWeight: 'bold' }}>
                <Iconify icon="eva:list-fill" sx={{ mr: 1 }} /> Preview (First 5 Rows)
              </Typography>
              <TableContainer component={Paper} sx={{ maxHeight: 180, border: '1px solid #f0f0f0', borderRadius: 1 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Name</TableCell>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Phone</TableCell>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Email</TableCell>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Weight (gm)</TableCell>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Pincode</TableCell>
                      <TableCell sx={{ bgcolor: '#f5f5f5' }}>Comments</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {importPreview.slice(0, 5).map((row, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{row.name || '-'}</TableCell>
                        <TableCell>{row.phone || '-'}</TableCell>
                        <TableCell>{row.email || '-'}</TableCell>
                        <TableCell>{row.weight}</TableCell>
                        <TableCell>{row.pincode || '-'}</TableCell>
                        <TableCell>{row.comments || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #f0f0f0' }}>
          <Button variant="outlined" onClick={() => setOpenImportModal(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitImport}
            disabled={importPreview.length === 0}
            sx={{
              color: '#fff',
              bgcolor: '#8A1B9F',
              '&:hover': { bgcolor: '#7B1FA2' },
              '&.Mui-disabled': { bgcolor: 'rgba(0, 0, 0, 0.12)', color: 'rgba(0, 0, 0, 0.26)' }
            }}
          >
            Import {importPreview.length} Leads
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function PreviewImportedLead({ data }) {
  if (!data) return <div>No data found</div>;

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <Typography variant="h5" sx={{ color: '#000', mb: 3 }}>
        Imported Lead Details
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Name</Typography>
          <Typography variant="body1">{data.name}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Phone / Mobile</Typography>
          <Typography variant="body1">{data.phone}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Email</Typography>
          <Typography variant="body1">{data.email || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Weight</Typography>
          <Typography variant="body1">{data.weight} gm</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Pincode</Typography>
          <Typography variant="body1">{data.pincode || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="textSecondary">Import Date</Typography>
          <Typography variant="body1">{moment(data.createdAt).format('LLLL')}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="textSecondary">Comments</Typography>
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{data.comments || 'N/A'}</Typography>
        </Grid>
      </Grid>
    </Card>
  );
}





