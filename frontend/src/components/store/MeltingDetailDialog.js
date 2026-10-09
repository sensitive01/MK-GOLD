import PropTypes from 'prop-types';
import moment from 'moment';
import { sentenceCase } from 'change-case';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Stack,
  Typography,
  Box,
  Card,
  Divider,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import Iconify from '../iconify';
import Label from '../label';
import global from '../../utils/global';

MeltingDetailDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  melting: PropTypes.object,
};

export default function MeltingDetailDialog({ open, onClose, melting }) {
  if (!melting) return null;

  const renderProofCard = (title, proof) => {
    if (!proof) return null;
    const fileUrl = proof?.uploadedFile || (typeof proof === 'string' ? proof : null);
    if (!fileUrl) return null;
    const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${global.BASE_URL}/${fileUrl}`;
    const isPdf = fileUrl.toLowerCase().endsWith('.pdf');

    return (
      <Grid item xs={12}>
        <Card variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1.5 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Iconify icon="eva:external-link-outline" />}
              onClick={() => window.open(fullUrl, '_blank')}
            >
              {isPdf ? 'Open PDF' : 'View Full Image'}
            </Button>
          </Stack>
          {isPdf ? (
            <Box
              component="iframe"
              src={fullUrl}
              title={title}
              sx={{ width: '100%', height: 320, border: '1px solid #e0e0e0', borderRadius: 1 }}
            />
          ) : (
            <Box
              component="img"
              src={fullUrl}
              alt={title}
              sx={{
                width: '100%',
                maxHeight: 320,
                objectFit: 'contain',
                borderRadius: 1,
                bgcolor: '#fff',
                border: '1px solid #eee',
                cursor: 'pointer',
              }}
              onClick={() => window.open(fullUrl, '_blank')}
            />
          )}
        </Card>
      </Grid>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Iconify icon="mdi:fire" width={26} sx={{ color: '#7b1fa2' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Melting Batch Details
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          {melting.batchNumber && (
            <Typography
              variant="subtitle2"
              sx={{ bgcolor: '#ede7f6', color: '#7b1fa2', px: 1.5, py: 0.5, borderRadius: 1, fontWeight: 700 }}
            >
              Batch: {melting.batchNumber}
            </Typography>
          )}
          <IconButton onClick={onClose} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 2 }}>
        <Grid container spacing={2.5}>
          {/* Basic Batch Information */}
          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Date & Time
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {moment(melting.createdAt).format('YYYY-MM-DD hh:mm A')}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Transit IDs
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {melting.transitIds?.length
                ? melting.transitIds.map((t) => t.transitId || t).join(', ')
                : melting.transitId?.transitId || 'N/A'}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Current Status
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {melting.status === 'sold' ? (
                <Label color="success">Bar Sold</Label>
              ) : melting.status === 'melt_updated' ? (
                <Label color="success">Melt Completed</Label>
              ) : melting.isPreMeltCompleted || melting.status === 'in_melt' ? (
                <Label sx={{ bgcolor: '#ed6c02', color: '#fff' }}>In Melting</Label>
              ) : (
                <Label color="info">Added to Melt</Label>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="caption" color="text.secondary">
              Total Ornaments
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {melting.totalOrnaments || melting.ornaments?.length || 0}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Estimated Gross Weight
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {Number(melting.totalGrossWeight || 0).toFixed(2)} g
            </Typography>

            <Typography variant="caption" color="text.secondary">
              Estimated Net Weight
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              {Number(melting.totalNetWeight || 0).toFixed(2)} g
            </Typography>
          </Grid>

          {melting.notes && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Batch Creation Notes
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {melting.notes}
              </Typography>
            </Grid>
          )}

          {melting.meltProof ? (
            renderProofCard('Batch Creation Proof / Photo (Move to Melting)', melting.meltProof)
          ) : (
            <Grid item xs={12}>
              <Card variant="outlined" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 1.5, border: '1px dashed #d1d5db' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="eva:image-outline" sx={{ color: 'text.disabled' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                    Batch Creation Proof / Photo
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                  No batch photo was uploaded at Step 4 during Move to Melting for this batch.
                </Typography>
              </Card>
            </Grid>
          )}

          {/* Stage 1: Pre-Melt Verification */}
          {(melting.isPreMeltCompleted ||
            melting.actualGrossWeight != null ||
            melting.actualNetWeight != null ||
            melting.actualStoneWastage != null ||
            melting.preMeltProof) && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ color: '#ed6c02', fontWeight: 700, mb: 1 }}>
                  Stage 1: Before Melting (Pre-Melt Details)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 1.5, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                  <Typography variant="caption" color="text.secondary">
                    Actual Gross Weight
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#c2410c' }}>
                    {melting.actualGrossWeight != null ? `${Number(melting.actualGrossWeight).toFixed(2)} g` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 1.5, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                  <Typography variant="caption" color="text.secondary">
                    Actual Net Weight
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#c2410c' }}>
                    {melting.actualNetWeight != null ? `${Number(melting.actualNetWeight).toFixed(2)} g` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Card sx={{ p: 1.5, bgcolor: '#fff7ed', border: '1px solid #ffedd5' }}>
                  <Typography variant="caption" color="text.secondary">
                    Stone Wastage
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#c2410c' }}>
                    {melting.actualStoneWastage != null ? `${Number(melting.actualStoneWastage).toFixed(2)} g` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              {(melting.preMeltNotes || (!melting.isPreMeltCompleted && melting.notes)) && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Pre-Melt Remarks
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {melting.preMeltNotes || melting.notes}
                  </Typography>
                </Grid>
              )}

              {renderProofCard('Pre-Melt Proof / Verification Photo', melting.preMeltProof)}
            </>
          )}

          {/* Stage 2: Final Melt Results */}
          {(melting.status === 'melt_updated' ||
            melting.status === 'sold' ||
            melting.barWeight != null ||
            melting.afterMeltProof) && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ color: '#7b1fa2', fontWeight: 700, mb: 1 }}>
                  Stage 2: After Melting (Final Bar Results)
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 1.5, bgcolor: '#faf5ff', border: '1px solid #f3e8ff' }}>
                  <Typography variant="caption" color="text.secondary">
                    Final Bar Weight
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                    {melting.barWeight != null ? `${Number(melting.barWeight).toFixed(2)} g` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Card sx={{ p: 1.5, bgcolor: '#faf5ff', border: '1px solid #f3e8ff' }}>
                  <Typography variant="caption" color="text.secondary">
                    Final Bar Purity
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                    {melting.barPurity != null ? `${Number(melting.barPurity).toFixed(2)} %` : 'N/A'}
                  </Typography>
                </Card>
              </Grid>

              {melting.weightDifference != null && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Weight Difference (vs Net Weight)
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: Number(melting.weightDifference) < 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {Number(melting.weightDifference) > 0 ? '+' : ''}
                    {Number(melting.weightDifference).toFixed(2)} g
                  </Typography>
                </Grid>
              )}

              {melting.purityDifference != null && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">
                    Purity Difference
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontWeight: 700,
                      color: Number(melting.purityDifference) < 0 ? 'error.main' : 'success.main',
                    }}
                  >
                    {Number(melting.purityDifference) > 0 ? '+' : ''}
                    {Number(melting.purityDifference).toFixed(2)} %
                  </Typography>
                </Grid>
              )}

              {melting.meltUpdateNotes && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    After-Melt Remarks
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {melting.meltUpdateNotes}
                  </Typography>
                </Grid>
              )}

              {renderProofCard('After-Melt Bar Proof / Photo', melting.afterMeltProof)}
            </>
          )}

          {/* Sale Information (if sold) */}
          {melting.status === 'sold' && (
            <>
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" sx={{ color: 'success.main', fontWeight: 700, mb: 1 }}>
                  Sale Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Sold Amount
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>
                  ₹ {Number(melting.sellAmount || 0).toLocaleString('en-IN')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Payment Mode
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {melting.paymentMode || 'N/A'}
                </Typography>
              </Grid>
            </>
          )}

          {/* Included Ornaments List */}
          {melting.ornaments && melting.ornaments.length > 0 && (
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
              <Typography variant="subtitle1" sx={{ color: '#7b1fa2', fontWeight: 700, mb: 1 }}>
                Included Ornaments ({melting.ornaments.length})
              </Typography>
              <Box sx={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#faf5ff' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Article No</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ornament Type</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Gross Wt (g)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Net Wt (g)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Purity (%)</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {melting.ornaments.map((orn, idx) => {
                      const art = orn.articleNumber;
                      const artStr = art ? String(art).trim() : '-';
                      const lastPart = artStr.includes('-') ? artStr.split('-').pop() : artStr;
                      const match = lastPart.match(/\d{3,}/) || artStr.match(/\d{3,}/) || artStr.match(/\d+/);
                      const displayArt = match ? match[0] : (lastPart || artStr);

                      return (
                        <TableRow key={idx} hover>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 600, color: '#7b1fa2' }}>
                            {displayArt}
                          </TableCell>
                          <TableCell>{orn.ornamentType || '-'}</TableCell>
                          <TableCell>{Number(orn.grossWeight || 0).toFixed(2)}</TableCell>
                          <TableCell>{Number(orn.netWeight || 0).toFixed(2)}</TableCell>
                          <TableCell>{Number(orn.purity || 0).toFixed(2)}%</TableCell>
                          <TableCell>₹{Number(orn.netAmount || 0).toLocaleString('en-IN')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button onClick={onClose} variant="contained" sx={{ bgcolor: '#7b1fa2', color: '#fff', '&:hover': { bgcolor: '#6a1b9a' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
