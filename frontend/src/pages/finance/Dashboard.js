import { Helmet } from 'react-helmet-async';
// @mui
import { Backdrop, CircularProgress, Container, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
// sections
import { getCount } from '../../apis/accounts/dashboard';
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function DashboardPage() {
  const [count, setCount] = useState(null);
  const [openBackdrop, setOpenBackdrop] = useState(true);

  useEffect(() => {
    getCount().then((data) => {
      setCount(data.data);
      setOpenBackdrop(false);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title> Finance Dashboard | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Hi, Welcome back
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
              title="Today's customers"
              total={count?.todayCustomers}
              icon={'mdi:account-group'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's bills"
              total={count?.todayBills}
              icon={'mdi:file-document-edit'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's physical bills"
              total={count?.todayPhysicalBills}
              icon={'mdi:printer-pos'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's pledge bills"
              total={count?.todayPledgeBills}
              icon={'mdi:handshake'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Total gross weight"
              total={count?.totalGrossWeight}
              icon={'mdi:weight'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary
              title="Total net amount"
              total={count?.totalNetAmount}
              icon={'mdi:cash-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <AppWidgetSummary 
              title="Total expenses" 
              total={count?.totalExpenses} 
              icon={'mdi:wallet'} 
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
