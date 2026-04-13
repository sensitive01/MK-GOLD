import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
// @mui
import { Container, Grid, Link, Typography, Card, Box, Stack, Button } from '@mui/material';
// components
import Iconify from '../../components/iconify';
import { QRCodeSVG } from 'qrcode.react';
// sections
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function DashboardAppPage() {
  const { auth } = useSelector((state) => state);

  return (
    <>
      <Helmet>
        <title> Dashboard | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 5 }}>
          <Typography variant="h4" sx={{ color: '#fff' }}>
            Hi, Welcome back
          </Typography>
          
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Iconify icon="mdi:download" />}
            onClick={() => {
              // We'll use the hidden QR code rendered below for the download logic
              const svg = document.querySelector('#branch-mgr-qr svg');
              if (!svg) {
                alert("QR code not ready yet. Please wait a moment.");
                return;
              }
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
                downloadLink.download = `Branch_QR_${auth.user?.branch?.branchName || 'MK Gold'}.png`;
                downloadLink.href = `${pngFile}`;
                downloadLink.click();
              };
              img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
            }}
          >
            Download QR
          </Button>
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/customer" underline="none">
              <AppWidgetSummary
                title="Customers"
                total={false}
                icon={'mdi:account-group'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/sale" underline="none">
              <AppWidgetSummary
                title="Billing"
                total={false}
                icon={'mdi:file-document-edit'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/expense" underline="none">
              <AppWidgetSummary
                title="Expenses"
                total={false}
                icon={'mdi:wallet'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/fund" underline="none">
              <AppWidgetSummary
                title="Funds"
                total={false}
                icon={'mdi:bank'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/leave" underline="none">
              <AppWidgetSummary
                title="Leave"
                total={false}
                icon={'mdi:calendar-remove'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/branch/attendance" underline="none">
              <AppWidgetSummary
                title="Attendance"
                total={false}
                icon={'mdi:clock-check'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>
        </Grid>

        <Typography variant="h5" sx={{ mt: 5, mb: 3, color: '#fff' }}>
          Branch Customer QR Code
        </Typography>

        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Scan to navigate to Enquiry Page
          </Typography>
          
          <Box id="branch-mgr-qr" sx={{ p: 2, bgcolor: '#fff', display: 'inline-block', borderRadius: 2, mb: 3 }}>
            <QRCodeSVG 
               value={`${window.location.origin}/enquiry/${auth.user?.branch?._id || auth.user?.branch}`} 
               size={200}
               level="H"
               includeMargin
            />
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              fullWidth
              color="secondary"
              startIcon={<Iconify icon="mdi:download" />}
              onClick={() => {
                const svg = document.querySelector('#branch-mgr-qr svg');
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
                  downloadLink.download = `Branch_QR.png`;
                  downloadLink.href = `${pngFile}`;
                  downloadLink.click();
                };
                img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
              }}
            >
              Download PNG
            </Button>
            <Button 
                variant="outlined" 
                fullWidth 
                component="a"
                href={`/enquiry/${auth.user?.branch?._id || auth.user?.branch}`}
                target="_blank"
            >
              Open Link
            </Button>
          </Stack>
        </Card>
      </Container>
    </>
  );
}
