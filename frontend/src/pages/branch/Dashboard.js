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

export default function DashboardAppPage() {
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

  const isBullionDesk = auth.user?.userType === 'bullion_desk' || window.location.pathname.startsWith('/bullion-desk');

  const bullionQuickLinks = [
    { title: 'Gold Rate', path: '/bullion-desk/gold-rate', icon: 'mdi:gold', bgColor: '#FFD700' },
    { title: 'Billing', path: '/bullion-desk/sale', icon: 'mdi:file-document-edit', bgColor: '#fff' },
    { title: 'Releases', path: '/bullion-desk/release', icon: 'mdi:file-document-check', bgColor: '#FFD700' },
    { title: 'Leave', path: '/bullion-desk/leave', icon: 'mdi:calendar-remove', bgColor: '#fff' },
    { title: 'Attendance', path: '/bullion-desk/attendance', icon: 'mdi:clock-check', bgColor: '#FFD700' },
  ];

  const branchQuickLinks = [
    { title: 'Customers', path: '/branch/customer', icon: 'mdi:account-group', bgColor: '#fff' },
    { title: 'Billing', path: '/branch/sale', icon: 'mdi:file-document-edit', bgColor: '#FFD700' },
    { title: 'Expenses', path: '/branch/expense', icon: 'mdi:wallet', bgColor: '#fff' },
    { title: 'Funds', path: '/branch/fund', icon: 'mdi:bank', bgColor: '#FFD700' },
    { title: 'Leave', path: '/branch/leave', icon: 'mdi:calendar-remove', bgColor: '#fff' },
    { title: 'Attendance', path: '/branch/attendance', icon: 'mdi:clock-check', bgColor: '#FFD700' },
  ];

  const quickLinks = isBullionDesk ? bullionQuickLinks : branchQuickLinks;

  return (
    <>
      <Helmet>
        <title> Dashboard | MK Gold </title>
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

        <Box sx={{ mb: { xs: 3.5, sm: 5 } }}>
          <Typography
            variant="h6"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              color: '#fff',
              opacity: 0.95,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              fontWeight: 600,
            }}
          >
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

        <Typography
          variant="h6"
          sx={{
            mb: { xs: 1.5, sm: 2 },
            color: '#fff',
            opacity: 0.95,
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            fontWeight: 600,
          }}
        >
          Quick Links
        </Typography>

        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
          {quickLinks.map((link) => (
            <Grid item xs={6} sm={6} md={3} key={link.title}>
              <Link href={link.path} underline="none">
                <AppWidgetSummary
                  title={link.title}
                  total={false}
                  icon={link.icon}
                  bgColor={link.bgColor}
                  iconColor="#8A1B9F"
                  textColor="#000"
                />
              </Link>
            </Grid>
          ))}
        </Grid>
      </Container>
    </>
  );
}

