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
export { LEAD_DOCUMENT_TYPES } from './CustomerDocumentsInput';

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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [logForm, setLogForm] = useState({
    status: '',
    remark: '',
    branch: '',
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
      setUploadedFiles([]);
      setLogForm({
        status: '',
        remark: '',
        branch: '',
        callbackDate: '',
        callbackTime: '',
      });
    }
  }, [open]);

  const handleFilesSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setUploadedFiles((prev) => [...prev, ...selected]);
    }
    e.target.value = '';
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLog = () => {
    if (!logForm.status) return;
    setAddingLog(true);

    const formData = new FormData();
    formData.append('status', logForm.status);
    formData.append('remark', logForm.remark);
    if (logForm.branch) formData.append('branch', logForm.branch);
    if (uploadedFiles.length > 0) {
      uploadedFiles.forEach((file) => {
        formData.append('uploadedFiles', file);
        formData.append('documentTypes', 'Proof');
      });
    }
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
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ textTransform: 'none', py: 1 }}
            >
              {uploadedFiles.length > 0 ? '+ Upload More Proofs' : 'Upload Proofs'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*,application/pdf,.pdf"
                onChange={handleFilesSelect}
              />
            </Button>

            {uploadedFiles.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5, maxHeight: 180, overflowY: 'auto' }}>
                {uploadedFiles.map((file, idx) => (
                  <Box
                    key={`${file.name}-${idx}`}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      p: 0.8,
                      px: 1.5,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                      {file.type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf') ? (
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: 'error.lighter',
                            color: 'error.main',
                            fontWeight: 700,
                            fontSize: '0.65rem',
                          }}
                        >
                          PDF
                        </Box>
                      ) : (
                        <Box
                          component="img"
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          sx={{
                            width: 36,
                            height: 36,
                            objectFit: 'cover',
                            borderRadius: 0.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#fff',
                          }}
                        />
                      )}
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024).toFixed(1)} KB
                        </Typography>
                      </Box>
                    </Stack>
                    <IconButton
                      size="small"
                      onClick={() => handleRemoveFile(idx)}
                      color="error"
                      sx={{ ml: 1 }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Stack>
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
