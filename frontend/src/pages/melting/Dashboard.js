import { Helmet } from 'react-helmet-async';
import { Backdrop, CircularProgress, Container, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { getCount } from '../../apis/admin/dashboard';
import { AppWidgetSummary } from '../../sections/@dashboard/app';

export default function DashboardPage() {
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [count, setCount] = useState(null);

  useEffect(() => {
    getCount().then((data) => {
      setCount(data.data);
      setOpenBackdrop(false);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title> MELTING Dashboard | MK Gold </title>
      </Helmet>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          MELTING Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's gold rate"
              total={count?.todayGoldRate}
              icon={'mdi:gold'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's Physical Bills"
              total={count?.todayPhysicalBills}
              icon={'mdi:file-document-outline'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's Pledged Bills"
              total={count?.todayPledgeBills}
              icon={'mdi:file-document-outline'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's Gross Weight"
              total={count?.totalGrossWeight ? count.totalGrossWeight.toFixed(2) + ' g' : '0 g'}
              icon={'mdi:weight-gram'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
