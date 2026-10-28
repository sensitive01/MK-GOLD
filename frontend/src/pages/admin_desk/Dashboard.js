import { Helmet } from 'react-helmet-async';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
// @mui
import { Container, Grid, Typography, Box } from '@mui/material';
// apis
import { getGoldRateByState } from '../../apis/branch/gold-rate';
// sections
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function AdminDeskDashboard() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const [goldRate, setGoldRate] = useState(null);
  const [silverRate, setSilverRate] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const state = auth.user?.branch?.address?.state || 'Karnataka';
    setLoadingRates(true);
    const today = moment().format('YYYY-MM-DD');
      
    // Fetch gold rate
    getGoldRateByState({
      state: state,
      type: 'gold',
      date: today,
    }).then((res) => {
      if (res?.status && res?.data) {
        setGoldRate(res.data.rate);
      }
    });

    // Fetch silver rate
    getGoldRateByState({
      state: state,
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

        <Box sx={{ mb: 5 }}>
          <Typography variant="h6" sx={{ mb: 2, color: '#fff', opacity: 0.9 }}>
            Today's Rates ({auth.user?.branch?.address?.state || 'Karnataka'})
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Gold Rate (per Gram)"
                total={loadingRates ? 'Loading...' : (goldRate ? `₹ ${goldRate}` : 'Not Set')}
                icon={'mdi:gold'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
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

        <Typography variant="h6" sx={{ mb: 2, color: '#fff', opacity: 0.9 }}>
          Quick Links
        </Typography>

        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Customers"
              total={false}
              icon={'mdi:account-group'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/customer')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Billing"
              total={false}
              icon={'mdi:file-document-edit'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/sale')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Expenses"
              total={false}
              icon={'mdi:wallet'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/expense')}
            />
          </Grid>
          
          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Funds"
              total={false}
              icon={'mdi:bank'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/fund')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Leave"
              total={false}
              icon={'mdi:calendar-remove'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/leave')}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="Attendance"
              total={false}
              icon={'mdi:clock-check'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/attendance')}
            />
          </Grid>

          <Grid item xs={6} sm={6} md={3}>
            <AppWidgetSummary
              title="My Tasks"
              total={false}
              icon={'mdi:clipboard-check-outline'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin-desk/tasks')}
            />
          </Grid>
        </Grid>
      </Container>
    </>
  );
}
