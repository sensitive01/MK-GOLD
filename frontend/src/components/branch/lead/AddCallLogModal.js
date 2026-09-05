import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Grid,
  Stack,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { useState, useEffect } from 'react';
import { addDisposition } from '../../../apis/branch/lead';
import { getBranch } from '../../../apis/branch/branch';

const DISPOSITIONS = [
  'RNR',
  'Wrong Enquiry',
  'Follow Up',
  'Planning to Visit',
  'Sold outside',
  'Price issues',
  'Not Connected',
  'Not Feasible',
  'Business Closed',
];

export default function AddCallLogModal({ open, onClose, leadId, onSuccess }) {
  const [addingLog, setAddingLog] = useState(false);
  const [branches, setBranches] = useState([]);
  const [logForm, setLogForm] = useState({
    status: '',
    remark: '',
    branch: '',
    uploadedFile: null,
    callbackDate: '',
    callbackTime: '',
  });

  useEffect(() => {
    if (open) {
      getBranch().then((res) => {
        if (res?.status) {
          setBranches(res.data || []);
        }
      });
      setLogForm({
        status: '',
        remark: '',
        branch: '',
        uploadedFile: null,
        callbackDate: '',
        callbackTime: '',
      });
    }
  }, [open]);

  const handleAddLog = () => {
    if (!logForm.status) return;
    setAddingLog(true);

    const formData = new FormData();
    formData.append('status', logForm.status);
    formData.append('remark', logForm.remark);
    if (logForm.branch) formData.append('branch', logForm.branch);
    if (logForm.uploadedFile) formData.append('uploadedFile', logForm.uploadedFile);
    if (logForm.status === 'Callback' || logForm.status === 'Planning to Visit' || logForm.status === 'Follow Up' || logForm.status === 'Business Closed') {
      if (logForm.callbackDate) formData.append('callbackDate', logForm.callbackDate);
      if (logForm.callbackTime) formData.append('callbackTime', logForm.callbackTime);
    }

    addDisposition(leadId, formData).then((res) => {
      setAddingLog(false);
      if (res.status) {
        if (onSuccess) onSuccess();
        onClose();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          m: { xs: 1.5, sm: 3 },
          maxHeight: { xs: 'calc(100% - 24px)', sm: 'calc(100% - 64px)' },
        },
      }}
    >
      <DialogTitle
        sx={{
          m: 0,
          p: { xs: 2, sm: 2.5 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          Add New Call Log
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 2.5 } }}>
        <Grid container spacing={2.5} sx={{ mt: 0.2 }}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={logForm.status}
                onChange={(e) => setLogForm({ ...logForm, status: e.target.value })}
              >
                {DISPOSITIONS?.map((d) => (
                  <MenuItem key={d} value={d}>
                    {d}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {(logForm.status === 'Visited Branch' ||
            logForm.status === 'Planning to Visit' ||
            logForm.status === 'Business Closed') && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Branch</InputLabel>
                <Select
                  label="Select Branch"
                  value={logForm.branch}
                  onChange={(e) => setLogForm({ ...logForm, branch: e.target.value })}
                >
                  {branches?.map((b) => (
                    <MenuItem key={b._id} value={b._id}>
                      {b.branchName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {(logForm.status === 'Callback' ||
            logForm.status === 'Planning to Visit' ||
            logForm.status === 'Follow Up' ||
            logForm.status === 'Business Closed') && (
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
            {logForm.uploadedFile ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 1,
                  px: 2,
                }}
              >
                <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {logForm.uploadedFile.name}
                </Typography>
                <IconButton size="small" onClick={() => setLogForm({ ...logForm, uploadedFile: null })} color="error" sx={{ ml: 1 }}>
                  <span style={{ fontSize: '18px', lineHeight: 1 }}>&times;</span>
                </IconButton>
              </Box>
            ) : (
              <Button variant="outlined" component="label" fullWidth sx={{ textTransform: 'none' }}>
                Upload Photo
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setLogForm({ ...logForm, uploadedFile: e.target.files[0] })}
                />
              </Button>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 1.5, borderTop: 1, borderColor: 'divider' }}>
        <Button variant="outlined" onClick={onClose}>
          Cancel
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleAddLog}
          loading={addingLog}
          disabled={!logForm.status}
        >
          Save Log
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
