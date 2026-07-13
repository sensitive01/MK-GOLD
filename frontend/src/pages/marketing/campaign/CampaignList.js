import { filter } from 'lodash';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Helmet } from 'react-helmet-async';
import moment from 'moment';
import {
  Card, Table, Stack, Paper, Button, TableRow, TableBody, TableCell,
  Container, Typography, TableContainer, TablePagination, TableHead, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Snackbar, Alert, Chip
} from '@mui/material';
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import { getCampaigns, addLoadAmount, deleteCampaign } from '../../../apis/marketing/campaign';

const TABLE_HEAD = [
  { id: 'campaignId', label: 'Campaign ID', alignRight: false },
  { id: 'campaignName', label: 'Name', alignRight: false },
  { id: 'campaignType', label: 'Type', alignRight: false },
  { id: 'campaignStatus', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'actions', label: 'Actions', alignRight: false, alignCenter: true },
];

export default function CampaignList() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const userType = auth?.user?.userType || 'marketing';
  const basePath = userType === 'admin' ? '/admin/marketing/campaigns' : '/marketing/campaigns';
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [openLoadFunds, setOpenLoadFunds] = useState(false);
  const [openViewFunds, setOpenViewFunds] = useState(false);
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  const [selectedCampaign, setSelectedCampaign] = useState([]);
  const [loadDate, setLoadDate] = useState(moment().format('YYYY-MM-DD'));
  const [loadAmount, setLoadAmount] = useState('');
  const [loadMode, setLoadMode] = useState('Net banking');
  const [loadType, setLoadType] = useState('');
  const [loadNotes, setLoadNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    getCampaigns().then((res) => {
      if (res?.status) {
        setData(res.data);
      }
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      const res = await deleteCampaign(id);
      if (res?.status) {
        setNotify({ open: true, message: 'Campaign deleted', severity: 'success' });
        fetchData();
      } else {
        setNotify({ open: true, message: res?.message || 'Error deleting campaign', severity: 'error' });
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleLoadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCampaign || selectedCampaign.length === 0) {
      setNotify({ open: true, message: 'Please select at least one campaign', severity: 'error' });
      return;
    }
    const payload = {
      date: loadDate,
      amount: Number(loadAmount),
      mode: loadMode,
      type: loadType,
      notes: loadNotes
    };
    
    let hasError = false;
    for (const id of selectedCampaign) {
      const res = await addLoadAmount(id, payload);
      if (!res?.status) {
        hasError = true;
        setNotify({ open: true, message: res?.message || 'Error', severity: 'error' });
        break;
      }
    }
    
    if (!hasError) {
      setNotify({ open: true, message: 'Amount loaded successfully', severity: 'success' });
      setOpenLoadFunds(false);
      setLoadAmount('');
      setLoadType('');
      setLoadNotes('');
      setSelectedCampaign([]);
      fetchData();
    }
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;

  return (
    <>
      <Helmet>
        <title> Campaigns | MK Gold </title>
      </Helmet>

      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Campaigns
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="info"
              startIcon={<Iconify icon="eva:eye-fill" />}
              onClick={() => setOpenViewFunds(true)}
            >
              View Funds
            </Button>
            <Button
              variant="contained"
              color="warning"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => setOpenLoadFunds(true)}
            >
              Load Funds
            </Button>
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:plus-fill" />}
              onClick={() => navigate(`${basePath}/new`)}
            >
              New Campaign
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3} mb={5}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
              <Typography variant="h6">Total Campaigns</Typography>
              <Typography variant="h4">{data?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
              <Typography variant="h6">Active Campaigns</Typography>
              <Typography variant="h4">{data?.filter(c => c.campaignStatus === 'Active')?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
              <Typography variant="h6">Paused Campaigns</Typography>
              <Typography variant="h4">{data?.filter(c => c.campaignStatus === 'Paused' || c.campaignStatus === 'paused')?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
              <Typography variant="h6">Available Funds</Typography>
              <Typography variant="h4">
                ₹{data?.reduce((acc, campaign) => {
                  let campaignTotal = 0;
                  if (campaign.loadAmounts) {
                    campaignTotal += campaign.loadAmounts.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.amount, 0);
                  }
                  if (campaign.dailyStatuses) {
                    campaignTotal -= campaign.dailyStatuses.reduce((sum, s) => sum + s.spent, 0);
                  }
                  return acc + campaignTotal;
                }, 0) || 0}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {TABLE_HEAD.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.alignCenter ? 'center' : (headCell.alignRight ? 'right' : 'left')}
                      >
                        {headCell.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { _id, campaignId, campaignName, campaignType, campaignStatus, createdAt } = row;
                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell align="left">{campaignId}</TableCell>
                        <TableCell align="left">{campaignName}</TableCell>
                        <TableCell align="left">{campaignType}</TableCell>
                        <TableCell align="left">{campaignStatus}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => navigate(`${basePath}/view/${_id}`)}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="info"
                              size="small"
                              onClick={() => navigate(`${basePath}/edit/${_id}`)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="outlined" 
                              color="error"
                              size="small"
                              onClick={() => handleDelete(_id)}
                            >
                              Delete
                            </Button>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                  {data?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No campaigns found</Typography>
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

      <Dialog open={openLoadFunds} onClose={() => setOpenLoadFunds(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleLoadSubmit}>
          <DialogTitle>Load Funds</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField fullWidth required select SelectProps={{ multiple: true }} label="Campaign" value={selectedCampaign} onChange={(e) => setSelectedCampaign(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}>
                  {data.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.campaignName}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required type="date" label="Date" InputLabelProps={{ shrink: true }} value={loadDate} onChange={(e) => setLoadDate(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required type="number" label="Amount" value={loadAmount} onChange={(e) => setLoadAmount(e.target.value)} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth required select label="Mode" value={loadMode} onChange={(e) => setLoadMode(e.target.value)}>
                  {["Net banking", "Credit / debit card", "UPi / QR", "Bank transfer", "Promotion", "Others"].map(m => (
                    <MenuItem key={m} value={m}>{m}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Type" value={loadType} onChange={(e) => setLoadType(e.target.value)} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Notes" value={loadNotes} onChange={(e) => setLoadNotes(e.target.value)} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenLoadFunds(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Load Amount</Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={openViewFunds} onClose={() => setOpenViewFunds(false)} maxWidth="md" fullWidth>
        <DialogTitle>Loaded Funds History</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Campaign Name</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Mode</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const allLoadAmounts = data.reduce((acc, campaign) => {
                    if (campaign.loadAmounts) {
                      campaign.loadAmounts.forEach(load => {
                        acc.push({ ...load, campaignName: campaign.campaignName });
                      });
                    }
                    return acc;
                  }, []).sort((a, b) => new Date(b.date) - new Date(a.date));

                  if (allLoadAmounts.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>No funds loaded yet</TableCell>
                      </TableRow>
                    );
                  }

                  return allLoadAmounts.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.campaignName}</TableCell>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>₹{row.amount}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                      <TableCell>{row.type || '-'}</TableCell>
                      <TableCell>{row.notes || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.status || 'Pending'} color={(row.status === 'Approved' && 'success') || (row.status === 'Rejected' && 'error') || 'warning'} />
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewFunds(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
