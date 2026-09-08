import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Card,
  Grid,
  Typography,
  Stack,
  Divider,
  Box,
  Avatar,
  Button,
  CircularProgress,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import moment from 'moment';
import { sentenceCase } from 'change-case';
import { QRCodeSVG } from 'qrcode.react';
import { getBranchById } from '../../../apis/admin/branch';
import global from '../../../utils/global';
import Iconify from '../../iconify';
import Label from '../../label';

function PreviewBranch({ id, setToggleContainerType, onOpenQr }) {
  const [branch, setBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const mainEl = document.querySelector('main') || document.querySelector('div[class*="Main"]');
    if (mainEl) mainEl.scrollTop = 0;

    if (id) {
      setLoading(true);
      getBranchById(id)
        .then((res) => {
          if (res && res.status && res.data) {
            setBranch(res.data);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [id]);

  const handleCopyId = () => {
    if (branch?.branchId) {
      navigator.clipboard.writeText(branch.branchId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadQr = () => {
    const svg = document.querySelector('#branch-detail-qr-svg svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${branch?.branchName || 'branch'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  if (loading) {
    return (
      <Card sx={{ p: 6, textAlign: 'center', my: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
          Loading branch details...
        </Typography>
      </Card>
    );
  }

  if (!branch) {
    return (
      <Card sx={{ p: 6, textAlign: 'center', my: 3 }}>
        <Typography variant="h6" color="error">
          Branch details not found.
        </Typography>
      </Card>
    );
  }

  const {
    branchId,
    branchName,
    gstNumber,
    address = {},
    isHeadOffice,
    status,
    image,
    createdAt,
    updatedAt,
    lastEditedBy,
  } = branch;

  const imageUrl = image?.uploadedFile
    ? image.uploadedFile.startsWith('http')
      ? image.uploadedFile
      : `${global.baseURL}/${image.uploadedFile.replace(/\\/g, '/')}`
    : null;

  const enquiryUrl = `${window.location.origin}/enquiry/${branch._id}`;
  const hasCoordinates = address.latitude && address.longitude;
  const mapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${encodeURIComponent(address.latitude)},${encodeURIComponent(address.longitude)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${address.address || ''} ${address.area || ''} ${address.city || ''} ${address.pincode || ''}`
      )}`;

  return (
    <Stack spacing={3} sx={{ pb: 4 }}>
      {/* Hero Header Card */}
      <Card sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm="auto">
            {imageUrl ? (
              <Avatar
                src={imageUrl}
                alt={branchName}
                variant="rounded"
                sx={{
                  width: { xs: 90, sm: 110 },
                  height: { xs: 90, sm: 110 },
                  borderRadius: 2,
                  boxShadow: 2,
                  bgcolor: 'grey.100',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Box
                sx={{
                  width: { xs: 90, sm: 110 },
                  height: { xs: 90, sm: 110 },
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighter',
                  color: 'primary.main',
                  boxShadow: 1,
                }}
              >
                <Iconify icon="mdi:office-building-marker" width={52} height={52} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12} sm>
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {sentenceCase(branchName || '')}
                </Typography>
                <Label color={status === 'active' ? 'success' : 'error'} sx={{ textTransform: 'uppercase', px: 1.5 }}>
                  {status === 'active' ? 'Active' : 'Deactive'}
                </Label>
                {isHeadOffice === 'yes' && (
                  <Chip
                    icon={<Iconify icon="mdi:crown" sx={{ color: '#8A1B9F !important' }} />}
                    label="Head Office"
                    size="small"
                    sx={{
                      bgcolor: '#FFC107',
                      color: '#8A1B9F',
                      fontWeight: 700,
                    }}
                  />
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Branch ID:
                </Typography>
                <Chip
                  label={branchId}
                  size="small"
                  variant="outlined"
                  sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                />
                <Tooltip title={copied ? 'Copied!' : 'Copy Branch ID'}>
                  <IconButton size="small" onClick={handleCopyId} color={copied ? 'success' : 'default'}>
                    <Iconify icon={copied ? 'eva:checkmark-fill' : 'eva:copy-outline'} width={16} height={16} />
                  </IconButton>
                </Tooltip>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" sx={{ color: 'text.secondary', pt: 0.5 }}>
                {address.city && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="mdi:map-marker-outline" width={18} height={18} />
                    <Typography variant="body2">
                      {[address.city, address.state].filter(Boolean).join(', ')}
                    </Typography>
                  </Stack>
                )}
                {createdAt && (
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Iconify icon="mdi:calendar-outline" width={18} height={18} />
                    <Typography variant="body2">
                      Created: {moment(createdAt).format('DD MMM YYYY')}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Stack>
          </Grid>

          <Grid item xs={12} md="auto">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="contained"
                startIcon={<Iconify icon="eva:edit-fill" />}
                onClick={() => {
                  if (setToggleContainerType) setToggleContainerType('update');
                }}
              >
                Edit Branch
              </Button>
              <Button
                variant="outlined"
                startIcon={<Iconify icon="mdi:qrcode" />}
                onClick={() => {
                  if (onOpenQr) onOpenQr(branch);
                }}
              >
                Show QR
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Card>

      {/* Summary Stat Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2.5,
        }}
      >
        <StatCard
          icon="mdi:receipt-text-outline"
          iconColor="#1890FF"
          iconBg="#E6F7FF"
          label="GST Number"
          value={gstNumber || 'Not Specified'}
        />
        <StatCard
          icon="mdi:map-marker-outline"
          iconColor="#52C41A"
          iconBg="#F6FFED"
          label="Location"
          value={address.city || address.area || 'Not Set'}
        />
        <StatCard
          icon="mdi:domain"
          iconColor="#722ED1"
          iconBg="#F9F0FF"
          label="Office Type"
          value={isHeadOffice === 'yes' ? 'Head Office' : 'Standard Branch'}
        />
        <StatCard
          icon="mdi:clock-outline"
          iconColor="#FA8C16"
          iconBg="#FFF7E6"
          label="Registration Date"
          value={createdAt ? moment(createdAt).format('YYYY-MM-DD') : 'N/A'}
        />
      </Box>

      {/* Details Sections */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        {/* Left Column: Address & Location */}
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="mdi:map-marker-radius-outline" sx={{ color: 'primary.main' }} />
                Address & Location
              </Typography>
              <Button
                size="small"
                variant="outlined"
                color="primary"
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<Iconify icon="mdi:google-maps" />}
              >
                Google Maps
              </Button>
            </Stack>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2}>
              <DetailRow label="Street Address" value={address.address} />
              <DetailRow label="Landmark" value={address.landmark} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DetailRow label="Area" value={address.area} />
                </Grid>
                <Grid item xs={6}>
                  <DetailRow label="City" value={address.city} />
                </Grid>
                <Grid item xs={6}>
                  <DetailRow label="State" value={address.state} />
                </Grid>
                <Grid item xs={6}>
                  <DetailRow label="Pincode" value={address.pincode} />
                </Grid>
              </Grid>
            </Stack>
          </Box>

          <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5, fontWeight: 600 }}>
              Geographic Coordinates
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Latitude
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {address.latitude || 'Not Set'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ p: 1.5, bgcolor: 'background.neutral', borderRadius: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    Longitude
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.25 }}>
                    {address.longitude || 'Not Set'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Right Column: Customer Enquiry QR Code */}
        <Card
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Iconify icon="mdi:qrcode-scan" sx={{ color: 'primary.main' }} />
              Customer Enquiry QR Code
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Customers can scan this QR code to submit enquiry directly to this branch.
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', py: 1 }}>
              <Box
                id="branch-detail-qr-svg"
                sx={{
                  p: 2,
                  bgcolor: '#fff',
                  display: 'inline-block',
                  borderRadius: 2,
                  boxShadow: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <QRCodeSVG value={enquiryUrl} size={150} level="H" includeMargin />
              </Box>

              <Box
                sx={{
                  mt: 2,
                  mb: 1,
                  px: 1.5,
                  py: 0.75,
                  bgcolor: 'background.neutral',
                  borderRadius: 1,
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  {enquiryUrl}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} sx={{ mt: 3, width: '100%' }}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              size="medium"
              startIcon={<Iconify icon="mdi:download" />}
              onClick={handleDownloadQr}
            >
              Download PNG
            </Button>
            <Button
              fullWidth
              variant="outlined"
              size="medium"
              startIcon={<Iconify icon="mdi:open-in-new" />}
              href={enquiryUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Page
            </Button>
          </Stack>
        </Card>
      </Box>
    </Stack>
  );
}

PreviewBranch.propTypes = {
  id: PropTypes.string,
  setToggleContainerType: PropTypes.func,
  onOpenQr: PropTypes.func,
};

function StatCard({ icon, iconColor, iconBg, label, value }) {
  return (
    <Card sx={{ p: 2.5, width: '100%', height: '100%', display: 'flex', alignItems: 'center' }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 1.5,
            bgcolor: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={26} height={26} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', fontWeight: 600 }}>
            {label}
          </Typography>
          <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Card>
  );
}

StatCard.propTypes = {
  icon: PropTypes.string,
  iconColor: PropTypes.string,
  iconBg: PropTypes.string,
  label: PropTypes.string,
  value: PropTypes.string,
};

function DetailRow({ label, value }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.25 }}>
        {value || '-'}
      </Typography>
    </Box>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};

export default PreviewBranch;
