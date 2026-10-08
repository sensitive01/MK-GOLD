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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
  Chip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { LoadingButton } from '@mui/lab';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CustomerDocumentsGallery from './CustomerDocumentsGallery';
import { getLeadById, addDisposition, assignExecutive, getBranchExecutives, moveToBusiness, tlApproveLead, tlRejectLead, bullionApproveLead, bullionRejectLead } from '../../../apis/branch/lead';
import { getBranch } from '../../../apis/branch/branch';
import global from '../../../utils/global';
import moment from 'moment';
import Iconify from '../../iconify';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

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

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '92%', sm: 500 },
  maxWidth: 500,
  maxHeight: '90vh',
  overflowY: 'auto',
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: { xs: 2.5, sm: 4 },
};

function PreviewLead(props) {
  const auth = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [addingLog, setAddingLog] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [viewLogModal, setViewLogModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [branches, setBranches] = useState([]);
  const [visiblePhone, setVisiblePhone] = useState(false);

  // Assign Executive state
  const [openAssignModal, setOpenAssignModal] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedExecutiveId, setSelectedExecutiveId] = useState('');
  const [branchExecutives, setBranchExecutives] = useState([]);
  const [loadingExecutives, setLoadingExecutives] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [logForm, setLogForm] = useState({
    status: '',
    remark: '',
    branch: '',
    callbackDate: '',
    callbackTime: '',
  });

  const [callLogFiles, setCallLogFiles] = useState([]);

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

  useEffect(() => {
    if (props.autoOpenLogModal) {
      setOpenModal(true);
    }
  }, [props.autoOpenLogModal]);

  const handleCallLogFilesSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setCallLogFiles((prev) => [...prev, ...selected]);
    }
    e.target.value = '';
  };

  const handleRemoveCallLogFile = (index) => {
    setCallLogFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddLog = () => {
    if (!logForm.status) return;
    setAddingLog(true);

    const formData = new FormData();
    formData.append('status', logForm.status);
    formData.append('remark', logForm.remark);
    if (logForm.branch) formData.append('branch', logForm.branch);

    if (callLogFiles.length > 0) {
      callLogFiles.forEach((file) => {
        formData.append('uploadedFiles', file);
        formData.append('documentTypes', 'Proof');
      });
    }

    if (
      logForm.status === 'Callback' ||
      logForm.status === 'Planning to Visit' ||
      logForm.status === 'Follow Up' ||
      logForm.status === 'Business Closed'
    ) {
      if (logForm.callbackDate) formData.append('callbackDate', logForm.callbackDate);
      if (logForm.callbackTime) formData.append('callbackTime', logForm.callbackTime);
    }

    addDisposition(props.id, formData).then((res) => {
      if (res.status) {
        setLogForm({ status: '', remark: '', branch: '', callbackDate: '', callbackTime: '' });
        setCallLogFiles([]);
        fetchData();
        setOpenModal(false);
      }
      setAddingLog(false);
    });
  };

  const handleOpenAssignModal = () => {
    const currBranchId = data?.branch?._id || data?.branch || '';
    const currExecId = data?.assignedExecutive?._id || data?.assignedExecutive || '';
    setSelectedBranchId(currBranchId);
    setSelectedExecutiveId(currExecId);
    if (currBranchId) {
      setLoadingExecutives(true);
      getBranchExecutives(currBranchId).then((res) => {
        setBranchExecutives(res?.data || []);
        setLoadingExecutives(false);
      });
    } else {
      setBranchExecutives([]);
    }
    setOpenAssignModal(true);
  };

  const [openRejectDialog, setOpenRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleTLApprove = async () => {
    try {
      const res = await tlApproveLead(props.id);
      if (res && res.status) {
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: res.message || 'Lead approved and moved to Bullion Desk successfully!',
            severity: 'success',
          });
        }
        setData((prev) => ({ ...prev, tlStatus: 'approved', isMovedToBullionDesk: true, tlApprovedAt: new Date() }));
        if (props.fetchData) {
          props.fetchData();
        }
      } else if (props.setNotify) {
        props.setNotify({
          open: true,
          message: res?.message || 'Failed to approve lead',
          severity: 'error',
        });
      }
    } catch (err) {
      if (props.setNotify) {
        props.setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
      }
    }
  };

  const handleTLRejectConfirm = async () => {
    try {
      const res = await tlRejectLead(props.id, rejectReason);
      if (res && res.status) {
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: res.message || 'Lead rejected successfully',
            severity: 'info',
          });
        }
        setData((prev) => ({ ...prev, tlStatus: 'rejected', tlRejectionReason: rejectReason, isMovedToBullionDesk: false, status: 'rejected' }));
        setOpenRejectDialog(false);
        setRejectReason('');
        if (props.fetchData) {
          props.fetchData();
        }
      } else if (props.setNotify) {
        props.setNotify({
          open: true,
          message: res?.message || 'Failed to reject lead',
          severity: 'error',
        });
      }
    } catch (err) {
      if (props.setNotify) {
        props.setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
      }
    }
  };

  const [openBullionRejectDialog, setOpenBullionRejectDialog] = useState(false);
  const [bullionRejectReason, setBullionRejectReason] = useState('');
  const [submittingBullionReject, setSubmittingBullionReject] = useState(false);

  const handleBullionApprove = async () => {
    try {
      const res = await bullionApproveLead(props.id);
      if (res && res.status) {
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: 'Lead approved by Bullion Desk! You can now assign an executive.',
            severity: 'success',
          });
        }
        setData((prev) => ({ ...prev, bullionStatus: 'approved', bullionApprovedAt: new Date() }));
        if (props.fetchData) {
          props.fetchData();
        }
      } else if (props.setNotify) {
        props.setNotify({
          open: true,
          message: res?.message || 'Failed to approve lead',
          severity: 'error',
        });
      }
    } catch (err) {
      if (props.setNotify) {
        props.setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
      }
    }
  };

  const handleBullionRejectConfirm = async () => {
    if (!bullionRejectReason.trim()) {
      return;
    }
    try {
      setSubmittingBullionReject(true);
      const res = await bullionRejectLead(props.id, bullionRejectReason.trim());
      setSubmittingBullionReject(false);
      if (res && res.status) {
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: 'Lead rejected successfully',
            severity: 'info',
          });
        }
        setData((prev) => ({
          ...prev,
          bullionStatus: 'rejected',
          bullionRejectionReason: bullionRejectReason.trim(),
          status: 'rejected',
        }));
        setOpenBullionRejectDialog(false);
        setBullionRejectReason('');
        if (props.fetchData) {
          props.fetchData();
        }
      } else if (props.setNotify) {
        props.setNotify({
          open: true,
          message: res?.message || 'Failed to reject lead',
          severity: 'error',
        });
      }
    } catch (err) {
      setSubmittingBullionReject(false);
      if (props.setNotify) {
        props.setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
      }
    }
  };

  const handleMoveToBusinessPreview = async () => {
    try {
      const res = await moveToBusiness(props.id);
      if (res && res.status) {
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: res.message || 'Lead moved to business successfully!',
            severity: 'success',
          });
        }
        setData((prev) => ({ ...prev, isMovedToBusiness: true, movedToBusinessAt: new Date() }));
        if (props.fetchData) {
          props.fetchData();
        }
      } else if (props.setNotify) {
        props.setNotify({
          open: true,
          message: res?.message || 'Failed to move lead to business',
          severity: 'error',
        });
      }
    } catch (err) {
      if (props.setNotify) {
        props.setNotify({
          open: true,
          message: err.message || 'An error occurred',
          severity: 'error',
        });
      }
    }
  };

  const handleAssignSubmit = () => {
    if (!selectedBranchId || !selectedExecutiveId) return;
    setAssigning(true);
    const chosenExec = branchExecutives.find((e) => e._id === selectedExecutiveId);
    const execName = chosenExec ? chosenExec.name : '';

    assignExecutive(props.id, {
      branch: selectedBranchId,
      assignedExecutive: selectedExecutiveId,
      assignedExecutiveName: execName,
    })
      .then((res) => {
        setAssigning(false);
        if (res?.status) {
          setData(res.data);
          setOpenAssignModal(false);
          if (props.fetchData) {
            props.fetchData();
          }
          if (props.setNotify) {
            props.setNotify({
              open: true,
              message: 'Executive assigned successfully!',
              severity: 'success',
            });
          }
        } else {
          if (props.setNotify) {
            props.setNotify({
              open: true,
              message: res?.message || 'Failed to assign executive',
              severity: 'error',
            });
          }
        }
      })
      .catch((err) => {
        setAssigning(false);
        if (props.setNotify) {
          props.setNotify({
            open: true,
            message: err.message || 'Error assigning executive',
            severity: 'error',
          });
        }
      });
  };

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data found</div>;

  const currentImage = data.lead?.uploadedFile
    ? data.lead.uploadedFile.startsWith('http')
      ? data.lead.uploadedFile
      : `${global.baseURL}/${data.lead.uploadedFile}`
    : '';

  const branchNameDisplay = data.status === 'converted' && data.branch ? branches.find(b => b._id === (data.branch?._id || data.branch))?.branchName : null;

  const userType = auth?.user?.userType?.toLowerCase();
  const isRejected = data.status === 'rejected' || data.bullionStatus === 'rejected' || data.tlStatus === 'rejected';
  const isBullionDesk = ['bullion_desk', 'bullion-desk'].includes(userType);
  const isTelecallerRole = ['telecalling', 'telecaller_tl', 'telecaller-tl'].includes(userType);
  const canAssignExecutive = !isTelecallerRole && !isRejected && (!isBullionDesk || data.bullionStatus === 'approved');

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
        <Stack direction="row" spacing={1.5} alignItems="center">
          {canAssignExecutive && (
            <Button
              variant="contained"
              onClick={handleOpenAssignModal}
              startIcon={<PersonAddIcon sx={{ color: '#fff !important' }} />}
              sx={{
                bgcolor: '#8A1B9F',
                color: '#fff',
                '&:hover': { bgcolor: '#731485' },
              }}
            >
              Assign Executive
            </Button>
          )}
          {auth?.user?.userType === 'telecalling' && (
            data.isMovedToBusiness ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.8,
                  borderRadius: 1,
                  bgcolor: 'rgba(46, 125, 50, 0.12)',
                  color: '#2e7d32',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Iconify icon="eva:checkmark-circle-2-fill" sx={{ width: 18, height: 18 }} />
                Moved to Business
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleMoveToBusinessPreview}
                startIcon={<Iconify icon="eva:trending-up-fill" sx={{ color: '#ffffff !important' }} />}
                sx={{
                  bgcolor: '#8A1B9F',
                  color: '#ffffff !important',
                  '&:hover': { bgcolor: '#731485' },
                  '& .MuiButton-startIcon': { color: '#ffffff !important' },
                  '& svg': { color: '#ffffff !important', fill: '#ffffff !important' },
                }}
              >
                Move To Business
              </Button>
            )
          )}
          {['telecaller_tl', 'telecaller-tl'].includes(auth?.user?.userType?.toLowerCase()) && (
            data.tlStatus === 'approved' || data.isMovedToBullionDesk ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.8,
                  borderRadius: 1,
                  bgcolor: 'rgba(46, 125, 50, 0.12)',
                  color: '#2e7d32',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Iconify icon="eva:checkmark-circle-2-fill" sx={{ width: 18, height: 18 }} />
                Approved & Moved to Bullion Desk
              </Box>
            ) : (
              <Button
                variant="contained"
                onClick={handleTLApprove}
                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#ffffff !important' }} />}
                sx={{
                  bgcolor: '#2e7d32',
                  color: '#ffffff !important',
                  fontWeight: 600,
                  '&:hover': { bgcolor: '#1b5e20' },
                  '& .MuiButton-startIcon': { color: '#ffffff !important' },
                  '& svg': { color: '#ffffff !important', fill: '#ffffff !important' },
                }}
              >
                Approve
              </Button>
            )
          )}
          {['bullion_desk', 'bullion-desk'].includes(auth?.user?.userType?.toLowerCase()) && (
            data.status === 'rejected' || data.bullionStatus === 'rejected' ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.8,
                  borderRadius: 1,
                  bgcolor: '#ffebee',
                  color: '#d32f2f',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Iconify icon="eva:close-circle-fill" sx={{ width: 18, height: 18 }} />
                Rejected
              </Box>
            ) : data.bullionStatus === 'approved' ? (
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.5,
                  px: 2,
                  py: 0.8,
                  borderRadius: 1,
                  bgcolor: 'rgba(46, 125, 50, 0.12)',
                  color: '#2e7d32',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Iconify icon="eva:checkmark-circle-2-fill" sx={{ width: 18, height: 18 }} />
                Bullion Approved
              </Box>
            ) : (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  variant="contained"
                  onClick={handleBullionApprove}
                  startIcon={<Iconify icon="eva:checkmark-circle-2-fill" sx={{ color: '#ffffff !important' }} />}
                  sx={{
                    bgcolor: '#2e7d32',
                    color: '#ffffff !important',
                    fontWeight: 600,
                    '&:hover': { bgcolor: '#1b5e20' },
                    '& .MuiButton-startIcon': { color: '#ffffff !important' },
                    '& svg': { color: '#ffffff !important', fill: '#ffffff !important' },
                  }}
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    setBullionRejectReason('');
                    setOpenBullionRejectDialog(true);
                  }}
                  startIcon={<Iconify icon="eva:close-circle-fill" />}
                  sx={{ fontWeight: 600 }}
                >
                  Reject
                </Button>
              </Stack>
            )
          )}
          <Button
            variant="outlined"
            onClick={() => {
              if (props.setToggleContainerType) {
                 props.setToggleContainerType('update');
              }
            }}
            startIcon={<Iconify icon="eva:edit-fill" />}
          >
            Edit Lead
          </Button>
          {!['marketing', 'branch'].includes(auth?.user?.userType) && (
            <Button
              variant="contained"
              onClick={() => setOpenModal(true)}
              sx={{ bgcolor: '#FFD700', color: '#000', '&:hover': { bgcolor: '#FFC800' } }}
            >
              Add Call Log
            </Button>
          )}
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Name</Typography>
          <Typography variant="body1">{data.name}</Typography>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Mobile</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1">
              {visiblePhone ? data.mobile : global.maskPhoneNumber(data.mobile)}
            </Typography>
            <IconButton size="small" onClick={() => setVisiblePhone(!visiblePhone)} sx={{ ml: 1 }}>
              <Iconify icon={visiblePhone ? 'eva:eye-off-fill' : 'eva:eye-fill'} />
            </IconButton>
          </Box>
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

        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Category</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{data.category}</Typography>
        </Grid>
        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Weight</Typography>
          <Typography variant="body1">{data.weight} {data.unit}</Typography>
        </Grid>
        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Type</Typography>
          <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>{data.type}</Typography>
        </Grid>
        
        {data.type === 'pledged' && (
          <>
            <Grid item xs={12} sm={2}>
              <Typography variant="subtitle2" sx={{ color: 'purple' }}>Overall Release Amount</Typography>
              <Typography variant="body1">{data.releaseAmount}</Typography>
            </Grid>
            <Grid item xs={12} sm={2}>
              <Typography variant="subtitle2" sx={{ color: 'purple' }}>Pledged Amount</Typography>
              <Typography variant="body1">{data.pledgedAmount}</Typography>
            </Grid>
          </>
        )}

        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Preferred Language</Typography>
          <Typography variant="body1">{data.preferredLanguage || 'N/A'}</Typography>
        </Grid>

        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Status</Typography>
          <Box sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: data.status === 'pending' ? 'warning.main' : data.status === 'converted' ? 'primary.main' : data.status === 'rejected' ? 'info.main' : 'error.main', color: '#fff', width: 'fit-content', textTransform: 'capitalize', mt: 1 }}>
            {branchNameDisplay ? `${data.status} (${branchNameDisplay})` : data.status}
          </Box>
        </Grid>

        <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Assigned Branch</Typography>
          <Typography variant="body1">
            {data.branch?.branchName || (branches.find((b) => b._id === (data.branch?._id || data.branch))?.branchName) || '-'}
          </Typography>
        </Grid>

        {!['telecalling', 'telecaller_tl', 'telecaller-tl'].includes(auth?.user?.userType) && (
          <Grid item xs={12} sm={data.type === 'pledged' ? 2 : 3}>
            <Typography variant="subtitle2" sx={{ color: 'purple' }}>Assigned Executive</Typography>
            <Typography variant="body1">
              {data.assignedExecutive?.employee?.name || data.assignedExecutive?.username || data.assignedExecutiveName || '-'}
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}><Divider /></Grid>

        <Grid item xs={12} sm={12}>
          <Typography variant="subtitle2" sx={{ color: 'purple' }}>Remarks</Typography>
          <Typography variant="body1">{data.remarks || 'N/A'}</Typography>
        </Grid>

        <CustomerDocumentsGallery data={data} />

        {auth?.user?.userType !== 'marketing' && (
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
                  <TableCell align="center">Action</TableCell>
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
                        {(log.status === 'Callback' || log.status === 'Planning to Visit' || log.status === 'Follow Up') && (log.callbackDate || log.callbackTime) && (
                          <div style={{ fontSize: '0.85em', color: 'gray', marginTop: '4px' }}>
                            Date: {log.callbackDate || '-'} | Time: {log.callbackTime || '-'}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          if (log.documents && log.documents.length > 0) {
                            return (
                              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                {log.documents.map((d, idx) => {
                                  const url = d.documentFile?.startsWith('http')
                                    ? d.documentFile
                                    : `${global.baseURL}/${d.documentFile}`;
                                  return (
                                    <Chip
                                      key={idx}
                                      size="small"
                                      label={d.documentType || `Doc ${idx + 1}`}
                                      component="a"
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      clickable
                                      color="primary"
                                      variant="outlined"
                                      sx={{ m: 0.25, fontSize: '0.72rem', cursor: 'pointer' }}
                                    />
                                  );
                                })}
                              </Stack>
                            );
                          }
                          const files = log.attachments && log.attachments.length > 0
                            ? log.attachments
                            : log.attachment ? [log.attachment] : [];
                          if (files.length === 0) return '-';
                          if (files.length === 1) {
                            const url = files[0].startsWith('http') ? files[0] : `${global.baseURL}/${files[0]}`;
                            return (
                              <a href={url} target="_blank" rel="noreferrer">
                                View
                              </a>
                            );
                          }
                          return (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                              {files.map((file, idx) => {
                                const url = file.startsWith('http') ? file : `${global.baseURL}/${file}`;
                                return (
                                  <a key={idx} href={url} target="_blank" rel="noreferrer" style={{ marginRight: '6px' }}>
                                    View {idx + 1}
                                  </a>
                                );
                              })}
                            </Stack>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {log.createdBy?.employee
                          ? `${log.createdBy.employee.name} (${log.createdBy.employee.employeeId})`
                          : log.createdBy?.username || 'Self/System'}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedLog(log);
                            setViewLogModal(true);
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">No call logs found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
        )}
      </Grid>

      {/* View Log Details Modal */}
      <Modal open={viewLogModal} onClose={() => { setViewLogModal(false); setSelectedLog(null); }}>
        <Box sx={modalStyle}>
          <Typography variant="h6" gutterBottom>Call Log Details</Typography>
          {selectedLog && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Date & Time</Typography>
                <Typography variant="body1">{moment(selectedLog.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{selectedLog.status}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Remark</Typography>
                <Typography variant="body1">{selectedLog.remark || 'N/A'}</Typography>
              </Grid>
              
              {(selectedLog.status === 'Callback' || selectedLog.status === 'Planning to Visit') && (selectedLog.callbackDate || selectedLog.callbackTime) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Follow-up / Visit Info</Typography>
                  <Typography variant="body1">
                    Date: {selectedLog.callbackDate || 'N/A'} | Time: {selectedLog.callbackTime || 'N/A'}
                  </Typography>
                </Grid>
              )}

              {(selectedLog.status === 'Visited Branch' || selectedLog.status === 'Planning to Visit') && (selectedLog.branch || data.branch) && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">Branch Details</Typography>
                  <Typography variant="body1">{
                     branches.find(b => b._id === (selectedLog.branch || data.branch))?.branchName || (selectedLog.branch || data.branch)
                  }</Typography>
                </Grid>
              )}
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Done By</Typography>
                <Typography variant="body1">
                  {selectedLog.createdBy?.employee
                    ? `${selectedLog.createdBy.employee.name} (${selectedLog.createdBy.employee.employeeId})`
                    : selectedLog.createdBy?.username || 'Self/System'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="textSecondary">Attachments</Typography>
                <Typography variant="body1">
                  {(() => {
                    if (selectedLog.documents && selectedLog.documents.length > 0) {
                      return (
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {selectedLog.documents.map((d, idx) => {
                            const url = d.documentFile?.startsWith('http')
                              ? d.documentFile
                              : `${global.baseURL}/${d.documentFile}`;
                            return (
                              <Button
                                key={idx}
                                variant="outlined"
                                size="small"
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                component="a"
                                startIcon={<Iconify icon="mdi:file-document-outline" />}
                                sx={{ textTransform: 'none', my: 0.5 }}
                              >
                                {d.documentType || `Document #${idx + 1}`}
                              </Button>
                            );
                          })}
                        </Stack>
                      );
                    }
                    const files = (selectedLog.attachments && selectedLog.attachments.length > 0)
                      ? selectedLog.attachments
                      : (selectedLog.attachment ? [selectedLog.attachment] : []);
                    if (files.length === 0) return 'N/A';
                    return (
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {files.map((file, idx) => {
                          const url = file.startsWith('http') ? file : `${global.baseURL}/${file}`;
                          return (
                            <Button
                              key={idx}
                              variant="outlined"
                              size="small"
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              component="a"
                              sx={{ textTransform: 'none', my: 0.5 }}
                            >
                              Attachment {files.length > 1 ? `#${idx + 1}` : ''}
                            </Button>
                          );
                        })}
                      </Stack>
                    );
                  })()}
                </Typography>
              </Grid>

              <Grid item xs={12} sx={{ mt: 2 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" onClick={() => { setViewLogModal(false); setSelectedLog(null); }}>
                    Close
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}
        </Box>
      </Modal>

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
            {(logForm.status === 'Visited Branch' || logForm.status === 'Planning to Visit' || logForm.status === 'Business Closed') && (
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
            {(logForm.status === 'Callback' || logForm.status === 'Planning to Visit' || logForm.status === 'Follow Up' || logForm.status === 'Business Closed') && (
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
              {callLogFiles.length > 0 ? '+ Upload More Proofs' : 'Upload Proofs'}
              <input
                type="file"
                hidden
                multiple
                accept="image/*,application/pdf,.pdf"
                onChange={handleCallLogFilesSelect}
              />
            </Button>

            {callLogFiles.length > 0 && (
              <Stack spacing={1} sx={{ mt: 1.5, maxHeight: 180, overflowY: 'auto' }}>
                {callLogFiles.map((file, idx) => (
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
                      onClick={() => handleRemoveCallLogFile(idx)}
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

      {/* Assign Executive Modal */}
      <Dialog open={openRejectDialog} onClose={() => setOpenRejectDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Reject Lead</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Are you sure you want to reject this lead? You can optionally enter a reason below.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason (Optional)"
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenRejectDialog(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleTLRejectConfirm}>
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bullion Desk Reject Dialog */}
      <Dialog open={openBullionRejectDialog} onClose={() => setOpenBullionRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: '#d32f2f', fontWeight: 'bold' }}>Reject Lead (Bullion Desk)</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please enter remarks/reason for rejecting this lead.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason"
            variant="outlined"
            value={bullionRejectReason}
            onChange={(e) => setBullionRejectReason(e.target.value)}
            multiline
            rows={3}
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenBullionRejectDialog(false)} disabled={submittingBullionReject}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleBullionRejectConfirm}
            disabled={submittingBullionReject || !bullionRejectReason.trim()}
          >
            {submittingBullionReject ? 'Rejecting...' : 'Confirm Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      <Modal open={openAssignModal} onClose={() => setOpenAssignModal(false)}>
        <Box sx={modalStyle}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" sx={{ color: '#000' }}>
              Assign Executive
            </Typography>
            <IconButton size="small" onClick={() => setOpenAssignModal(false)}>
              <Iconify icon="eva:close-fill" />
            </IconButton>
          </Stack>
          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel id="assign-branch-label">Choose Branch</InputLabel>
              <Select
                labelId="assign-branch-label"
                value={selectedBranchId}
                label="Choose Branch"
                onChange={(e) => {
                  const branchId = e.target.value;
                  setSelectedBranchId(branchId);
                  setSelectedExecutiveId('');
                  if (branchId) {
                    setLoadingExecutives(true);
                    getBranchExecutives(branchId).then((res) => {
                      setBranchExecutives(res?.data || []);
                      setLoadingExecutives(false);
                    });
                  } else {
                    setBranchExecutives([]);
                  }
                }}
              >
                {branches.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    {b.branchName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" disabled={!selectedBranchId || loadingExecutives}>
              <InputLabel id="assign-executive-label">
                {loadingExecutives ? 'Loading executives...' : 'Choose Executive'}
              </InputLabel>
              <Select
                labelId="assign-executive-label"
                value={selectedExecutiveId}
                label={loadingExecutives ? 'Loading executives...' : 'Choose Executive'}
                onChange={(e) => setSelectedExecutiveId(e.target.value)}
              >
                {branchExecutives.length === 0 ? (
                  <MenuItem disabled value="">
                    {loadingExecutives ? 'Loading...' : 'No executives found for this branch'}
                  </MenuItem>
                ) : (
                  branchExecutives.map((exec) => (
                    <MenuItem key={exec._id} value={exec._id}>
                      {exec.name} {exec.designation ? `(${exec.designation})` : exec.userType ? `(${exec.userType})` : ''}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Stack direction="row" justifyContent="flex-end" spacing={1.5} mt={1}>
              <Button variant="outlined" onClick={() => setOpenAssignModal(false)}>
                Cancel
              </Button>
              <LoadingButton
                variant="contained"
                loading={assigning}
                disabled={!selectedBranchId || !selectedExecutiveId}
                onClick={handleAssignSubmit}
                sx={{
                  bgcolor: '#8A1B9F',
                  color: '#ffffff !important',
                  fontWeight: 600,
                  px: 2.5,
                  '&:hover': { bgcolor: '#731485' },
                  '&.Mui-disabled': {
                    bgcolor: 'rgba(138, 27, 159, 0.45)',
                    color: 'rgba(255, 255, 255, 0.8) !important',
                  },
                }}
              >
                Submit
              </LoadingButton>
            </Stack>
          </Stack>
        </Box>
      </Modal>
    </Card>
  );
}

export default PreviewLead;


