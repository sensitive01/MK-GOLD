import { Helmet } from 'react-helmet-async';
import { Container, Typography, Grid, Backdrop, CircularProgress } from '@mui/material';
import { useEffect, useState } from 'react';
import { getLeadStats } from '../../apis/branch/lead';
import { AppWidgetSummary } from '../../sections/@dashboard/app';

export default function DashboardPage() {
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getLeadStats().then((data) => {
      setStats(data.data);
      setOpenBackdrop(false);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title> TELECALLING Dashboard | MK Gold </title>
      </Helmet>
      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          TELECALLING Dashboard
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Total Leads"
              total={stats?.totalLeads}
              icon={'mdi:account-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Pending Leads"
              total={stats?.pendingLeads}
              icon={'mdi:clock-alert'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
        </Grid>
      </Container>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
