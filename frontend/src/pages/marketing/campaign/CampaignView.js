import { useEffect, useState, forwardRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
  const auth = useSelector((state) => state.auth);
  const userType = auth?.user?.userType || 'marketing';
  const basePath = userType === 'admin' ? '/admin/marketing' : '/marketing/campaigns';
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

  useEffect(() => {
    if (campaign && campaign.contentCalendar) {
      try {
        const calendars = JSON.parse(campaign.contentCalendar);
        const dayOfWeek = moment(statusDate).format('dddd');
        
        const matchingSchedules = calendars.filter(c => {
          if (c.days === 'All days') return true;
          if (c.days === 'Mondays - Fridays' && ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].includes(dayOfWeek)) return true;
          if (c.days === 'Saturdays - Sundays' && ['Saturday', 'Sunday'].includes(dayOfWeek)) return true;
          if (c.days === dayOfWeek) return true;
          return false;
        });

        if (matchingSchedules.length > 0) {
          const scheduleStr = matchingSchedules.map(c => 
            `${moment(c.startTime, 'HH:mm').format('hh:mm A')} to ${moment(c.endTime, 'HH:mm').format('hh:mm A')}`
          ).join(', ');
          setStatusSchedule(scheduleStr);
        } else {
          setStatusSchedule('No Schedule');
        }
      } catch (e) {
        setStatusSchedule('No Schedule');
      }
    }
  }, [statusDate, campaign]);

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

  const campaignAvailableFunds = 
    (campaign.loadAmounts?.filter(l => l.status === 'Approved').reduce((sum, l) => sum + l.amount, 0) || 0) - 
    (campaign.dailyStatuses?.reduce((sum, s) => sum + s.spent, 0) || 0);

  return (
    <>
      <Helmet><title> View Campaign | MK Gold </title></Helmet>
      <Snackbar open={notify.open} autoHideDuration={3000} onClose={() => setNotify({ ...notify, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert onClose={() => setNotify({ ...notify, open: false })} severity={notify.severity}>{notify.message}</Alert>
      </Snackbar>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h4" sx={{ color: '#fff' }}>Campaign: {campaign.campaignName}</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="h6" sx={{ color: 'warning.main', bgcolor: 'white', px: 2, py: 0.5, borderRadius: 1 }}>
              Available Funds: ₹{campaignAvailableFunds}
            </Typography>
            <Button variant="contained" startIcon={<Iconify icon="mdi:arrow-left" />} onClick={() => navigate(basePath)}>Back</Button>
          </Stack>
        </Stack>

        <Card>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
              <Tab label="Details" />
              <Tab label="Daily Status" />
            </Tabs>
          </Box>

          {/* Details Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={2}>
              {/* --- Basic Details --- */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: 'primary.main', borderBottom: '1px solid #eaeaea', pb: 1, mb: 1 }}>Basic Details</Typography>
              </Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Campaign ID</Typography><Typography>{campaign.campaignId}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Campaign Type</Typography><Typography>{campaign.campaignType}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Status</Typography><Typography>{campaign.campaignStatus}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Bid Strategy</Typography><Typography>{campaign.bidStrategy || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Objective</Typography><Typography>{campaign.objective || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Description</Typography><Typography>{campaign.description || 'N/A'}</Typography></Grid>

              {/* --- Accounts & Platform --- */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: 'primary.main', borderBottom: '1px solid #eaeaea', pb: 1, mb: 1, mt: 2 }}>Accounts & Platform</Typography>
              </Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Mail ID</Typography><Typography>{campaign.mailId || 'N/A'}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Team Members</Typography><Typography>{campaign.teamMembers || 'N/A'}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Ad Platform</Typography><Typography>{campaign.adPlatform || 'N/A'}</Typography></Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="subtitle2" color="text.secondary">Target Platforms</Typography>
                <Typography>{campaign.targetPlatform?.length > 0 ? campaign.targetPlatform.join(', ') : 'N/A'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Account Name / URL</Typography><Typography>{campaign.accountNameUrl || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">Landing Page URL</Typography><Typography>{campaign.landingPageUrl || 'N/A'}</Typography></Grid>
              
              {/* --- Creative & Targeting --- */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ color: 'primary.main', borderBottom: '1px solid #eaeaea', pb: 1, mb: 1, mt: 2 }}>Creative & Targeting</Typography>
              </Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Ad Format</Typography><Typography>{campaign.adFormat || 'N/A'}</Typography></Grid>
              <Grid item xs={6} md={3}><Typography variant="subtitle2" color="text.secondary">Ad Type</Typography><Typography>{campaign.adType || 'N/A'}</Typography></Grid>
              <Grid item xs={12} md={6}><Typography variant="subtitle2" color="text.secondary">CTA Link</Typography><Typography>{campaign.ctaLink || 'N/A'}</Typography></Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Target Audience (Gender & Age)</Typography>
                <Box mt={1}>
                  {(() => {
                    try {
                      if (!campaign.targetAudienceDemography) return <Typography>N/A</Typography>;
                      const demography = JSON.parse(campaign.targetAudienceDemography);
                      return demography.map((d, i) => (
                        <Chip key={i} label={`${d.gender}, ${d.fromAge}-${d.toAge}`} variant="outlined" size="small" sx={{ mr: 1, mb: 1 }} />
                      ));
                    } catch (e) {
                      return <Typography>{campaign.targetAudienceDemography}</Typography>;
                    }
                  })()}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary">Audience Location</Typography>
                <Box mt={1}>
                  {(() => {
                    try {
                      if (!campaign.targetAudienceLocation) return <Typography>N/A</Typography>;
                      const locations = JSON.parse(campaign.targetAudienceLocation);
                      if (!Array.isArray(locations) || locations.length === 0) return <Typography>N/A</Typography>;
                      return locations.map((loc, i) => (
                        <Chip 
                          key={i} 
                          label={loc.type === 'Radius' ? `⭕ ${loc.radius}km around ${loc.name}` : `📍 ${loc.name}`} 
                          variant="outlined" 
                          size="small" 
                          sx={{ mr: 1, mb: 1 }} 
                        />
                      ));
                    } catch (e) {
                      // Fallback for older string campaigns
                      return <Typography>{campaign.targetAudienceLocation || 'N/A'}</Typography>;
                    }
                  })()}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Content Calendar (Ad schedule)</Typography>
                <Box mt={1}>
                  {(() => {
                    try {
                      if (!campaign.contentCalendar) return <Typography>N/A</Typography>;
                      const calendar = JSON.parse(campaign.contentCalendar);
                      return calendar.map((c, i) => (
                        <Chip key={i} label={`${c.days}: ${c.startTime} - ${c.endTime}`} variant="outlined" size="small" sx={{ mr: 1, mb: 1 }} />
                      ));
                    } catch (e) {
                      return <Typography>{campaign.contentCalendar}</Typography>;
                    }
                  })()}
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Post Headings</Typography>
                <Box mt={1}>
                  {campaign.postHeadings && campaign.postHeadings.length > 0 ? (
                    campaign.postHeadings.map((heading, i) => (
                      <Chip key={i} label={heading} variant="outlined" size="small" sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography>N/A</Typography>
                  )}
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                  <Typography variant="caption" color="textSecondary">Post Descriptions</Typography>
                <Box mt={1}>
                  {campaign.postDescriptions && campaign.postDescriptions.length > 0 ? (
                    campaign.postDescriptions.map((desc, i) => (
                      <Chip key={i} label={desc} variant="outlined" size="small" sx={{ mr: 1, mb: 1 }} />
                    ))
                  ) : (
                    <Typography>N/A</Typography>
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">Ad Files</Typography>
                <Box mt={1} display="flex" flexWrap="wrap" gap={2}>
                  {campaign.adFiles && campaign.adFiles.length > 0 ? (
                    campaign.adFiles.map((fileUrl, i) => (
                       <a key={i} href={fileUrl} target="_blank" rel="noreferrer">
                         <img src={fileUrl} alt={`Ad File ${i+1}`} style={{ height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #ccc' }} />
                       </a>
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
                    <>
                      <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Schedule" value={statusSchedule} onChange={(e) => setStatusSchedule(e.target.value)} />
                      </Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Spent (₹)" type="number" value={statusSpent} onChange={(e) => setStatusSpent(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Impression" type="number" value={statusImpression} onChange={(e) => setStatusImpression(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Reach" type="number" value={statusReach} onChange={(e) => setStatusReach(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Clicks" type="number" value={statusClicks} onChange={(e) => setStatusClicks(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="CPC" type="number" value={statusCpc} onChange={(e) => setStatusCpc(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Calls" type="number" value={statusCalls} onChange={(e) => setStatusCalls(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Leads" type="number" value={statusLeads} onChange={(e) => setStatusLeads(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Qualified" type="number" value={statusQualified} onChange={(e) => setStatusQualified(e.target.value)} /></Grid>
                      <Grid item xs={6} md={2}><TextField fullWidth label="Conversions" type="number" value={statusConversions} onChange={(e) => setStatusConversions(e.target.value)} /></Grid>
                    </>
                  )}
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
        </Card>
      </Container>
    </>
  );
}
