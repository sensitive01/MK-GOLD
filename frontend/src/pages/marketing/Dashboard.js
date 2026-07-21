import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import moment from 'moment';
// @mui
import { Container, Grid, Link, Typography, Box } from '@mui/material';
// apis
import { getGoldRateByState } from '../../apis/branch/gold-rate';
// sections
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function MarketingDashboard() {
  const auth = useSelector((state) => state.auth);
  const [goldRate, setGoldRate] = useState(null);
  const [silverRate, setSilverRate] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const branch = auth.user?.branch;
    if (branch && branch.address?.state) {
      setLoadingRates(true);
      const today = moment().format('YYYY-MM-DD');
      
      // Fetch gold rate
      getGoldRateByState({
        state: branch.address.state,
        type: 'gold',
        date: today,
      }).then((res) => {
        if (res?.status && res?.data) {
          setGoldRate(res.data.rate);
        }
      });

      // Fetch silver rate
      getGoldRateByState({
        state: branch.address.state,
        type: 'silver',
        date: today,
      }).then((res) => {
        if (res?.status && res?.data) {
          setSilverRate(res.data.rate);
        }
        setLoadingRates(false);
      }).catch(() => {
        setLoadingRates(false);
      });
    } else {
      setLoadingRates(false);
    }
  }, [auth.user?.branch]);

  return (
    <>
      <Helmet>
        <title> Dashboard | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 4, color: '#fff' }}>
          Hi, Welcome back
        </Typography>

        {auth.user?.branch?.address?.state && (
          <Box sx={{ mb: 5 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#fff', opacity: 0.9 }}>
              Today's Rates ({auth.user.branch.address.state})
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Gold Rate (per Gram)"
                  total={loadingRates ? 'Loading...' : (goldRate ? `₹ ${goldRate}` : 'Not Set')}
                  icon={'mdi:gold'}
                  bgColor="#FFD700"
                  iconColor="#8A1B9F"
                  textColor="#000"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <AppWidgetSummary
                  title="Silver Rate (per Gram)"
                  total={loadingRates ? 'Loading...' : (silverRate ? `₹ ${silverRate}` : 'Not Set')}
                  icon={'mdi:silverware-spoon'}
                  bgColor="#fff"
                  iconColor="#8A1B9F"
                  textColor="#000"
                />
              </Grid>
            </Grid>
          </Box>
        )}

      </Container>
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, color: '#fff', opacity: 0.9 }}>
          Quick Links
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Link href="/marketing/campaigns" underline="none">
              <AppWidgetSummary
                title="Campaigns"
                total={false}
                icon={'mdi:bullhorn'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/marketing/leads" underline="none">
              <AppWidgetSummary
                title="Leads"
                total={false}
                icon={'mdi:account-group'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/marketing/expense" underline="none">
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
            <Link href="/marketing/attendance" underline="none">
              <AppWidgetSummary
                title="Attendance"
                total={false}
                icon={'mdi:calendar-clock'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Link>
          </Grid>
        </Grid>
      </Container>
    </>
  );
}

