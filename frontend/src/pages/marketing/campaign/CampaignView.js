import { useEffect, useState, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import moment from 'moment';
import {
  Card, Stack, Button, Container, Typography, Grid, Tabs, Tab, Box, TextField, MenuItem,
  Snackbar, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer, Chip
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Iconify from '../../../components/iconify';
import { getCampaignById, addDailyStatus, addLoadAmount } from '../../../apis/marketing/campaign';

const Alert = forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />);

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && (<Box sx={{ p: 3 }}>{children}</Box>)}
    </div>
  );
}

export default function CampaignView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [notify, setNotify] = useState({ open: false, message: '', severity: 'success' });
  
  // Daily Status Form
  const [statusDate, setStatusDate] = useState(moment().format('YYYY-MM-DD'));
  const [statusRunning, setStatusRunning] = useState('yes');
  const [statusReason, setStatusReason] = useState('');
  const [statusSchedule, setStatusSchedule] = useState('');
  const [statusSpent, setStatusSpent] = useState('');
  const [statusImpression, setStatusImpression] = useState('');
  const [statusReach, setStatusReach] = useState('');
  const [statusClicks, setStatusClicks] = useState('');
  const [statusCpc, setStatusCpc] = useState('');
  const [statusCalls, setStatusCalls] = useState('');
  const [statusLeads, setStatusLeads] = useState('');
  const [statusQualified, setStatusQualified] = useState('');
  const [statusConversions, setStatusConversions] = useState('');

  // Load Amount Form
  const [loadDate, setLoadDate] = useState(moment().format('YYYY-MM-DD'));
  const [loadAmount, setLoadAmount] = useState('');
  const [loadMode, setLoadMode] = useState('Net banking');
  const [loadType, setLoadType] = useState('');
  const [loadNotes, setLoadNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const res = await getCampaignById(id);
    if (res?.status) {
      setCampaign(res.data);
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: statusDate,
      running: statusRunning,
      reason: statusReason,
      schedule: statusSchedule,
      spent: Number(statusSpent),
      impression: Number(statusImpression),
      reach: Number(statusReach),
      clicks: Number(statusClicks),
      cpc: Number(statusCpc),
      calls: Number(statusCalls),
      leads: Number(statusLeads),
      qualifiedLeads: Number(statusQualified),
      conversions: Number(statusConversions)
    };
    const res = await addDailyStatus(id, payload);
    if (res?.status) {
      setNotify({ open: true, message: 'Status updated', severity: 'success' });
      fetchData();
    } else {
      setNotify({ open: true, message: res?.message || 'Error', severity: 'error' });
    }
  };

  const handleLoadSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      date: loadDate,
      amount: Number(loadAmount),
      mode: loadMode,
      type: loadType,
      notes: loadNotes
    };
    const res = await addLoadAmount(id, payload);
    if (res?.status) {
      setNotify({ open: true, message: 'Amount loaded', severity: 'success' });
      setLoadAmount('');
      setLoadType('');
      setLoadNotes('');
      fetchData();
    } else {
      setNotify({ open: true, message: res?.message || 'Error', severity: 'error' });
    }
  };

  if (!campaign) return null;

  return (
    <>
      <Helmet><title> View Campaign | MK Gold </title></Helmet>
      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" sx={{ color: '#fff' }}>Campaign: {campaign.campaignName}</Typography>
          <Button variant="contained" startIcon={<Iconify icon="mdi:arrow-left" />} onClick={() => navigate('/marketing/campaigns')}>Back</Button>
        </Stack>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
              <Tab label="Details" />
              <Tab label="Daily Status" />
              <Tab label="Budget Loads" />
            </Tabs>
          </Box>

          {/* Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}><Typography variant="subtitle2">ID</Typography><Typography>{campaign.campaignId}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2">Type</Typography><Typography>{campaign.campaignType}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2">Status</Typography><Typography>{campaign.campaignStatus}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2">Bid Strategy</Typography><Typography>{campaign.bidStrategy}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2">Objective</Typography><Typography>{campaign.objective || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2">Description</Typography><Typography>{campaign.description || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Post Heading(s)</Typography>
                <Box mt={1}>
                  {campaign.postHeadings && campaign.postHeadings.length > 0 ? (
                    campaign.postHeadings.map((heading, i) => (
                      <Chip key={i} label={heading} variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography>N/A</Typography>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2">Post Description(s)</Typography>
                <Box mt={1}>
                  {campaign.postDescriptions && campaign.postDescriptions.length > 0 ? (
                    campaign.postDescriptions.map((desc, i) => (
                      <Chip key={i} label={desc} variant="outlined" sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography>N/A</Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Daily Status Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box mb={4}>
              <Typography variant="h6" mb={2}>Update Status</Typography>
              <form onSubmit={handleStatusSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField 
                      fullWidth 
                      required 
                      type="date" 
                      label="Date" 
                      InputLabelProps={{ shrink: true }} 
                      inputProps={{ 
                        min: moment().subtract(3, 'days').format('YYYY-MM-DD'), 
                        max: moment().format('YYYY-MM-DD') 
                      }}
                      value={statusDate} 
                      onChange={(e) => setStatusDate(e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth select label="Running" value={statusRunning} onChange={(e) => setStatusRunning(e.target.value)}>
                      <MenuItem value="yes">Yes</MenuItem>
                      <MenuItem value="no">No</MenuItem>
                    </TextField>
                  </Grid>
                  {statusRunning === 'no' && (
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Reason" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} />
                    </Grid>
                  )}
                  {statusRunning === 'yes' && (
                    <Grid item xs={12} md={6}>
                      <TextField fullWidth label="Schedule" value={statusSchedule} onChange={(e) => setStatusSchedule(e.target.value)} />
                    </Grid>
                  )}
                  <Grid item xs={6} md={2}><TextField fullWidth label="Spent (₹)" type="number" value={statusSpent} onChange={(e) => setStatusSpent(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Impression" type="number" value={statusImpression} onChange={(e) => setStatusImpression(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Reach" type="number" value={statusReach} onChange={(e) => setStatusReach(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Clicks" type="number" value={statusClicks} onChange={(e) => setStatusClicks(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="CPC" type="number" value={statusCpc} onChange={(e) => setStatusCpc(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Calls" type="number" value={statusCalls} onChange={(e) => setStatusCalls(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Leads" type="number" value={statusLeads} onChange={(e) => setStatusLeads(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Qualified" type="number" value={statusQualified} onChange={(e) => setStatusQualified(e.target.value)} /></Grid>
                  <Grid item xs={6} md={2}><TextField fullWidth label="Conversions" type="number" value={statusConversions} onChange={(e) => setStatusConversions(e.target.value)} /></Grid>
                  <Grid item xs={12} mt={1}>
                    <Button type="submit" variant="contained">Update Status</Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
            
            <Typography variant="h6" mb={2}>Status History</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Running</TableCell>
                    <TableCell>Spent</TableCell>
                    <TableCell>Impr.</TableCell>
                    <TableCell>Reach</TableCell>
                    <TableCell>Clicks</TableCell>
                    <TableCell>Leads</TableCell>
                    <TableCell>Conv.</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaign.dailyStatuses?.sort((a,b)=> new Date(b.date) - new Date(a.date)).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>{row.running}</TableCell>
                      <TableCell>₹{row.spent}</TableCell>
                      <TableCell>{row.impression}</TableCell>
                      <TableCell>{row.reach}</TableCell>
                      <TableCell>{row.clicks}</TableCell>
                      <TableCell>{row.leads}</TableCell>
                      <TableCell>{row.conversions}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* Budget Loads Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box mb={4}>
              <Typography variant="h6" mb={2}>Load Amount</Typography>
              <form onSubmit={handleLoadSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth required type="date" label="Date" InputLabelProps={{ shrink: true }} value={loadDate} onChange={(e) => setLoadDate(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth required type="number" label="Amount" value={loadAmount} onChange={(e) => setLoadAmount(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth required select label="Mode" value={loadMode} onChange={(e) => setLoadMode(e.target.value)}>
                      {["Net banking", "Credit / debit card", "UPi / QR", "Bank transfer", "Promotion", "Others"].map(m => (
                        <MenuItem key={m} value={m}>{m}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <TextField fullWidth label="Type" value={loadType} onChange={(e) => setLoadType(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <TextField fullWidth label="Notes" value={loadNotes} onChange={(e) => setLoadNotes(e.target.value)} />
                  </Grid>
                  <Grid item xs={12} md={4} display="flex" alignItems="center">
                    <Button type="submit" variant="contained">Load Amount</Button>
                  </Grid>
                </Grid>
              </form>
            </Box>

            <Typography variant="h6" mb={2}>Load History</Typography>
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Mode</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Notes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaign.loadAmounts?.sort((a,b)=> new Date(b.date) - new Date(a.date)).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell>{row.date}</TableCell>
                      <TableCell>₹{row.amount}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                      <TableCell>{row.type || '-'}</TableCell>
                      <TableCell>{row.notes || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Card>
      </Container>
    </>
  );
}
