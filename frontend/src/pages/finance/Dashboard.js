import { Helmet } from 'react-helmet-async';
// @mui
import { Backdrop, CircularProgress, Container, Grid, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// sections
import { getCount } from '../../apis/accounts/dashboard';
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function DashboardPage() {
  const navigate = useNavigate();
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

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Typography
          variant="h4"
          sx={{
            mb: { xs: 2.5, sm: 4 },
            color: '#fff',
            fontSize: { xs: '1.5rem', sm: '1.875rem', md: '2.125rem' },
            fontWeight: 700,
          }}
        >
          Hi, Welcome back
        </Typography>

        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's gold rate"
              total={count?.todayGoldRate}
              icon={'mdi:gold'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              disableShorten={true}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's silver rate"
              total={count?.todaySilverRate}
              icon={'mdi:podium-silver'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              disableShorten={true}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's customers"
              total={count?.todayCustomers}
              icon={'mdi:account-group'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's bills"
              total={count?.todayBills}
              icon={'mdi:file-document-edit'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's physical bills"
              total={count?.todayPhysicalBills}
              icon={'mdi:printer-pos'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/finance/sale')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Today's pledge bills"
              total={count?.todayPledgeBills}
              icon={'mdi:handshake'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Total gross weight"
              total={count?.totalGrossWeight}
              icon={'mdi:weight'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/finance/sale')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Total net amount"
              total={count?.totalNetAmount}
              icon={'mdi:cash-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/finance/fund')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary 
              title="Total expenses" 
              total={count?.totalExpenses} 
              icon={'mdi:wallet'} 
              bgColor="#FFD700" 
              iconColor="#8A1B9F" 
              textColor="#000"
              onClick={() => navigate('/finance/expense')}
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
