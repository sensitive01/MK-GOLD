import {
  Card,
  Grid,
  Typography,
  Box,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Modal,
  Stack,
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useState, useEffect } from 'react';
import { getLeadById, addDisposition } from '../../../apis/branch/lead';
import { getBranch } from '../../../apis/branch/branch';
import global from '../../../utils/global';
import moment from 'moment';

const DISPOSITIONS = [
  'RNR',
  'Call Busy',
  'Switched Off',
  'Not Reachable',
  'Wrong Number',
  'Interested',
  'Not Interested',
  'Follow Up',
  'Branch Visit Confirmed',
  'Callback',
  'Planning to Visit',
];

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

function PreviewLead(props) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingLog, setAddingLog] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [logForm, setLogForm] = useState({
    status: '',
    remark: '',
    branch: '',
    uploadedFile: null,
    callbackDate: '',
    callbackTime: '',
  });

  const fetchData = () => {
    if (props.id) {
      getLeadById(props.id).then((res) => {
        if (res.status) {
          setData(res.data);
        }
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchData();
    getBranch().then((res) => {
      if (res?.status) {
        setBranches(res.data || []);
      }
    });
  }, [props.id]);

  const handleAddLog = () => {
    if (!logForm.status) return;
    setAddingLog(true);

    const formData = new FormData();
    formData.append('status', logForm.status);
    formData.append('remark', logForm.remark);
    if (logForm.branch) formData.append('branch', logForm.branch);
    if (logForm.uploadedFile) formData.append('uploadedFile', logForm.uploadedFile);
    if (logForm.status === 'Callback' || logForm.status === 'Planning to Visit') {
      if (logForm.callbackDate) formData.append('callbackDate', logForm.callbackDate);
      if (logForm.callbackTime) formData.append('callbackTime', logForm.callbackTime);
    }

    addDisposition(props.id, formData).then((res) => {
      if (res.status) {
        setLogForm({ status: '', remark: '', branch: '', uploadedFile: null, callbackDate: '', callbackTime: '' });
        fetchData();
        setOpenModal(false);
      }
      setAddingLog(false);
    });
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data found</div>;

  const currentImage = data.lead?.uploadedFile
    ? data.lead.uploadedFile.startsWith('http')
      ? data.lead.uploadedFile
      : `${global.baseURL}/${data.lead.uploadedFile}`
    : '';

  return (
    <Card sx={{ p: 4, my: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="column">
          <Typography variant="h5" sx={{ color: '#000' }}>
            Lead Details
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Created: {moment(data.createdAt).format('LLLL')}
          </Typography>
        </Stack>
        {data.leadSource !== 'marketing' && (
          <Button
            variant="contained"
            onClick={() => setOpenModal(true)}
            sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC800' } }}
          >
            Add Call Log
          </Button>
        )}
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Name</Typography>
          <Typography variant="body1">{data.name}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Mobile</Typography>
          <Typography variant="body1">{global.maskPhoneNumber(data.mobile)}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Source</Typography>
          <Typography variant="body1">{data.source || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Lead Date</Typography>
          <Typography variant="body1">{data.date ? moment(data.date).format('LL') : 'N/A'}</Typography>
        </Grid>

        <Grid item xs={12}><Divider /></Grid>

        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Address</Typography>
          <Typography variant="body1">
            {[data.address, data.state, data.city, data.place, data.pincode].filter(Boolean).join(', ')}
          </Typography>
        </Grid>

        <Grid item xs={12}><Divider /></Grid>

        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Category</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{data.category}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Weight</Typography>
          <Typography variant="body1">{data.weight} {data.unit}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Type</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{data.type}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Status</Typography>
          <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: data.status === 'pending' ? 'warning.main' : data.status === 'converted' ? 'success.main' : 'error.main', color: '#fff', width: 'fit-content', textTransform: 'capitalize', mt: 1 }}>
            {data.status}
          </Box>
        </Grid>

        {data.type === 'pledged' && (
          <>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ color: 'purple' }}>Overall Release Amount</Typography>
              <Typography variant="body1">{data.releaseAmount}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" sx={{ color: 'purple' }}>Pledged Amount</Typography>
              <Typography variant="body1">{data.pledgedAmount}</Typography>
            </Grid>
          </>
        )}

        <Grid item xs={12}><Divider /></Grid>

        <Grid item xs={12} sm={12}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Remarks</Typography>
          <Typography variant="body1">{data.remarks || 'N/A'}</Typography>
        </Grid>

        {currentImage && (
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>Attachment</Typography>
            <img
              src={currentImage}
              alt="attachment"
              style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }}
            />
          </Grid>
        )}

        {data.leadSource !== 'marketing' && (
          <Grid item xs={12}>
            <Divider sx={{ my: 4 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#000' }}>
              Tele-Calling Logs History
            </Typography>
            
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f0f0f0' }}>
                  <TableRow>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Remark</TableCell>
                    <TableCell>Attachment</TableCell>
                    <TableCell>Done By</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.dispositions && data.dispositions?.length > 0 ? (
                    data.dispositions?.slice().reverse()?.map((log, index) => (
                      <TableRow key={index}>
                        <TableCell>{moment(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{log.status}</TableCell>
                        <TableCell>
                          {log.remark || '-'}
                          {(log.status === 'Callback' || log.status === 'Planning to Visit') && (log.callbackDate || log.callbackTime) && (
                            <div style={{ fontSize: '0.85em', color: 'gray', marginTop: '4px' }}>
                              Date: {log.callbackDate || '-'} | Time: {log.callbackTime || '-'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.attachment ? (
                            <a href={log.attachment.startsWith('http') ? log.attachment : `${global.baseURL}/${log.attachment}`} target="_blank" rel="noreferrer">
                              View
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {log.createdBy?.employee
                            ? `${log.createdBy.employee.name} (${log.createdBy.employee.employeeId})`
                            : log.createdBy?.username || 'Self/System'}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">No call logs found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        )}
      </Grid>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>Add New Call Log</Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12}>
               <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={logForm.status}
                    onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
                  >
                    {DISPOSITIONS?.map(d => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                  </Select>
               </FormControl>
            </Grid>
            {(logForm.status === 'Branch Visit Confirmed' || logForm.status === 'Planning to Visit') && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Branch</InputLabel>
                  <Select
                    label="Select Branch"
                    value={logForm.branch}
                    onChange={(e) => setLogForm({ ...logForm, branch: e.target.value })}
                  >
                    {branches?.map(b => <MenuItem key={b._id} value={b._id}>{b.branchName}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
            )}
            {(logForm.status === 'Callback' || logForm.status === 'Planning to Visit') && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={logForm.callbackDate}
                    onChange={(e) => setLogForm({ ...logForm, callbackDate: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Time"
                    type="time"
                    InputLabelProps={{ shrink: true }}
                    value={logForm.callbackTime}
                    onChange={(e) => setLogForm({ ...logForm, callbackTime: e.target.value })}
                  />
                </Grid>
              </>
            )}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remark"
                multiline
                rows={3}
                value={logForm.remark}
                onChange={(e) => setLogForm({ ...logForm, remark: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="outlined" component="label" fullWidth sx={{ textTransform: 'none' }}>
                {logForm.uploadedFile ? logForm.uploadedFile.name : 'Upload Photo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setLogForm({ ...logForm, uploadedFile: e.target.files[0] })}
                />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button variant="outlined" onClick={() => setOpenModal(false)}>Cancel</Button>
                <LoadingButton
                  variant="contained"
                  onClick={handleAddLog}
                  loading={addingLog}
                  disabled={!logForm.status}
                >
                  Save Log
                </LoadingButton>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Modal>
    </Card>
  );
}

export default PreviewLead;


