import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Typography,
  Stack,
  Box,
  Grid,
  Card,
  Divider,
  CircularProgress,
  Chip,
  Link,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { sentenceCase } from 'change-case';
import moment from 'moment';
import Iconify from '../../iconify';
import Label from '../../label';
import { getExpenseById, updateExpense } from '../../../apis/accounts/expense';

function ViewExpense({ open, onClose, id, onStatusUpdate, setNotify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open && id) {
      setLoading(true);
      getExpenseById(id)
        .then((res) => {
          setData(res?.data || null);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load expense details:', err);
          setLoading(false);
        });
    } else {
      setData(null);
    }
  }, [open, id]);

  const handleStatusChange = (status) => {
    if (!id) return;
    setUpdating(true);
    updateExpense(id, { status })
      .then((res) => {
        setUpdating(false);
        if (res?.status === false) {
          if (setNotify) {
            setNotify({
              open: true,
              message: res.message || 'Failed to update expense status',
              severity: 'error',
            });
          }
        } else {
          setData((prev) => (prev ? { ...prev, status } : prev));
          if (setNotify) {
            setNotify({
              open: true,
              message: `Expense ${status === 'approved' ? 'Approved' : 'Rejected'} Successfully!`,
              severity: status === 'approved' ? 'success' : 'warning',
            });
          }
          if (onStatusUpdate) {
            onStatusUpdate();
          }
        }
      })
      .catch((err) => {
        setUpdating(false);
        console.error(err);
      });
  };

  const getStatusColor = (status) => {
    if (status === 'approved') return 'success';
    if (status === 'rejected') return 'error';
    return 'warning';
  };

  // Merge direct proof URLs and attachments list
  const allProofs = [];
  if (data?.openingProof) {
    allProofs.push({
      uploadedFile: data.openingProof,
      uploadType: 'Opening Odometer Proof',
    });
  }
  if (data?.closingProof) {
    allProofs.push({
      uploadedFile: data.closingProof,
      uploadType: 'Closing Odometer Proof',
    });
  }
  if (data?.proof) {
    allProofs.push({
      uploadedFile: data.proof,
      uploadType: `${data?.type || 'Expense'} Proof / Receipt`,
    });
  }
  if (data?.attachments && Array.isArray(data.attachments)) {
    data.attachments.forEach((att) => {
      if (
        att.uploadedFile &&
        !allProofs.some((p) => p.uploadedFile === att.uploadedFile)
      ) {
        allProofs.push({
          uploadedFile: att.uploadedFile,
          uploadType: att.uploadType || 'Attachment',
        });
      }
    });
  }

  const isImageFile = (url) => {
    if (!url || typeof url !== 'string') return false;
    return (
      url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) != null ||
      url.startsWith('data:image/')
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          m: 0,
          p: 2.5,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
          <Iconify icon="carbon:document" width={24} height={24} sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Expense Details
          </Typography>
          {data?.type && (
            <Chip
              label={data.type === 'Others' && data.otherTypeName ? `${data.type} (${data.otherTypeName})` : data.type}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {data?.status && (
            <Label color={getStatusColor(data.status)}>
              {sentenceCase(data.status)}
            </Label>
          )}
        </Stack>
        <IconButton aria-label="close" onClick={onClose} sx={{ color: 'text.secondary' }}>
          <Iconify icon="eva:close-fill" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : !data ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="body1" color="text.secondary">
              Expense details not found.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            {/* Top Summary Card */}
            <Card
              sx={{
                p: 2.5,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                border: '1px solid',
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.15),
                borderRadius: 2,
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Total Amount
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 700 }}>
                    ₹{Number(data.amount || 0).toLocaleString('en-IN')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Branch
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {data.branch?.branchName
                      ? `${data.branch.branchName}${data.branch.branchId ? ` (${data.branch.branchId})` : ''}`
                      : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Created Date
                  </Typography>
                  <Typography variant="subtitle2">
                    {moment(data.createdAt).format('DD MMM YYYY, hh:mm A')}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Created By
                  </Typography>
                  <Typography variant="subtitle2">
                    {data.creator?.name || data.creatorRole || 'Staff'}
                  </Typography>
                </Grid>
              </Grid>
            </Card>

            {/* Type Specific Details */}
            {data.type === 'Fuel' && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="mdi:gas-station" sx={{ color: 'primary.main' }} />
                  Fuel & Odometer Reading
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, bgcolor: 'background.neutral', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Opening Reading
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {data.openingRead != null ? `${data.openingRead} km` : '-'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, bgcolor: 'background.neutral', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Closing Reading
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {data.closingRead != null ? `${data.closingRead} km` : '-'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Card sx={{ p: 2, bgcolor: 'background.neutral', textAlign: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Overall Traveled
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mt: 0.5 }}>
                        {data.overallRead != null ? `${data.overallRead} km` : '-'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {data.type === 'Sales Incentive' && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="mdi:account-cash" sx={{ color: 'primary.main' }} />
                  Sales Incentive Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary">
                        Bill ID / Reference
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {data.billId || (typeof data.bill === 'object' ? data.bill?.billId : data.bill) || '-'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                      <Typography variant="caption" color="text.secondary">
                        Beneficiary Employee
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 0.5 }}>
                        {data.employee?.name ? `${data.employee.name} (${data.employee.employeeId || data.employee.role || 'Staff'})` : '-'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {data.type === 'Others' && data.otherTypeName && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Iconify icon="mdi:tag-outline" sx={{ color: 'primary.main' }} />
                  Expense Category
                </Typography>
                <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {data.otherTypeName}
                  </Typography>
                </Card>
              </Box>
            )}

            {/* Notes / Remarks */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="mdi:note-text-outline" sx={{ color: 'primary.main' }} />
                Notes & Remarks
              </Typography>
              <Card sx={{ p: 2, bgcolor: 'background.neutral' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {data.note || 'No notes added.'}
                </Typography>
              </Card>
            </Box>

            {/* Attached Proofs & Documents */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="mdi:paperclip" sx={{ color: 'primary.main' }} />
                Attached Proofs & Files ({allProofs.length})
              </Typography>

              {allProofs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No files or proofs attached to this expense.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {allProofs.map((item, idx) => {
                    const isImg = isImageFile(item.uploadedFile);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={idx}>
                        <Card
                          sx={{
                            p: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1.5,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            height: '100%',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: 2,
                            },
                          }}
                        >
                          {isImg ? (
                            <Box
                              component="a"
                              href={item.uploadedFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                height: 140,
                                width: '100%',
                                display: 'block',
                                borderRadius: 1,
                                overflow: 'hidden',
                                bgcolor: 'grey.100',
                              }}
                            >
                              <Box
                                component="img"
                                src={item.uploadedFile}
                                alt={item.uploadType}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                }}
                              />
                            </Box>
                          ) : (
                            <Box
                              sx={{
                                height: 140,
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 1,
                                bgcolor: 'grey.100',
                              }}
                            >
                              <Iconify icon="mdi:file-document-outline" width={48} height={48} sx={{ color: 'text.secondary' }} />
                            </Box>
                          )}

                          <Stack spacing={0.5} sx={{ mt: 'auto' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {item.uploadType}
                            </Typography>
                            <Button
                              size="small"
                              variant="outlined"
                              component="a"
                              href={item.uploadedFile}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<Iconify icon="mdi:open-in-new" width={14} height={14} />}
                              sx={{ textTransform: 'none', mt: 0.5 }}
                            >
                              View File
                            </Button>
                          </Stack>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, justifyContent: 'space-between', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) }}>
        <Box>
          {data?.status === 'pending' && (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={updating}
                startIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
                onClick={() => handleStatusChange('approved')}
              >
                Approve Expense
              </Button>
              <Button
                variant="contained"
                color="error"
                size="small"
                disabled={updating}
                startIcon={<Iconify icon="eva:close-circle-fill" />}
                onClick={() => handleStatusChange('rejected')}
              >
                Reject Expense
              </Button>
            </Stack>
          )}
        </Box>
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ViewExpense.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  id: PropTypes.string,
  onStatusUpdate: PropTypes.func,
  setNotify: PropTypes.func,
};

export default ViewExpense;

