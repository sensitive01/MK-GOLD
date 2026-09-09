import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Backdrop, Box, CircularProgress, Container, Grid, Link, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import moment from 'moment';
import { findTransit } from '../../apis/admin/transit';
import { getGoldRateByState } from '../../apis/branch/gold-rate';
import { AppWidgetSummary } from '../../sections/@dashboard/app';

export default function StoreDashboard() {
  const navigate = useNavigate();
  const auth = useSelector((state) => state.auth);
  const [data, setData] = useState([]);
  const [openBackdrop, setOpenBackdrop] = useState(true);
  const [goldRate, setGoldRate] = useState(null);
  const [silverRate, setSilverRate] = useState(null);
  const [loadingRates, setLoadingRates] = useState(true);

  useEffect(() => {
    const state = auth.user?.branch?.address?.state || 'Karnataka';
    const today = moment().format('YYYY-MM-DD');

    // Fetch Gold Rate
    getGoldRateByState({
      state,
      type: 'gold',
      date: today,
    })
      .then((res) => {
        if (res?.status && res?.data) {
          setGoldRate(res.data.rate);
        }
      })
      .catch(() => {});

    // Fetch Silver Rate
    getGoldRateByState({
      state,
      type: 'silver',
      date: today,
    })
      .then((res) => {
        if (res?.status && res?.data) {
          setSilverRate(res.data.rate);
        }
        setLoadingRates(false);
      })
      .catch(() => {
        setLoadingRates(false);
      });

    // Fetch Transits
    findTransit({})
      .then((res) => {
        if (Array.isArray(res?.data)) {
          setData(res.data);
        }
        setOpenBackdrop(false);
      })
      .catch(() => {
        setOpenBackdrop(false);
      });
  }, [auth.user?.branch]);

  const pendingCount = data.filter((row) => !row.storeReceived && row.status === 'intransit').length;
  const movedCount = data.filter((row) => row.status === 'moved').length;
  const deviationCount = data.filter((row) => row.deviations === 'yes' || row.status === 'submitted').length;
  const movedTransits = data.filter((row) => row.status === 'moved');
  const totalNetWeight = movedTransits
    .reduce((acc, curr) => acc + (Number(curr.totalNetWeight) || 0), 0)
    .toFixed(2);
  const physicalPackets = movedTransits.reduce((acc, curr) => acc + (Number(curr.physical) || 0), 0);
  const releasedPackets = movedTransits.reduce((acc, curr) => acc + (Number(curr.released) || 0), 0);
  const totalOrnaments = movedTransits.reduce((acc, curr) => acc + (Number(curr.numberOfOrnaments) || 0), 0);

  const quickLinks = [
    { title: 'Transit', path: '/store/gold-transit', icon: 'mdi:truck-delivery', bgColor: '#FFD700' },
    { title: 'Transit Outwards', path: '/store/transit-outwards', icon: 'mdi:send', bgColor: '#fff' },
    { title: 'Profile', path: '/store/profile', icon: 'mdi:account-circle', bgColor: '#FFD700' },
  ];

  return (
    <>
      <Helmet>
        <title> Dashboard | Store | MK Gold </title>
      </Helmet>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>

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

        {/* Today's Rates */}
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
                total={loadingRates ? 'Loading...' : goldRate ? `₹ ${goldRate}` : 'Not Set'}
                icon={'mdi:gold'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
                disableShorten={true}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Silver Rate (per Gram)"
                total={loadingRates ? 'Loading...' : silverRate ? `₹ ${silverRate}` : 'Not Set'}
                icon={'mdi:silverware-spoon'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
                disableShorten={true}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Operations & Inventory KPIs */}
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
            Store Operations & Custody
          </Typography>
          <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }}>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Pending Inwards"
                total={pendingCount}
                icon={'mdi:clock-alert-outline'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Moved in Store"
                total={movedCount}
                icon={'mdi:check-decagram'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Deviations Flagged"
                total={deviationCount}
                icon={'mdi:alert-circle-outline'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Total Net Gold in Store"
                total={`${totalNetWeight} g`}
                icon={'mdi:weight-gram'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
                disableShorten={true}
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Total Transits"
                total={data.length}
                icon={'mdi:package-variant-closed'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Physical Packets"
                total={physicalPackets}
                icon={'mdi:archive-outline'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Released Packets"
                total={releasedPackets}
                icon={'mdi:shield-check-outline'}
                bgColor="#FFD700"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
            <Grid item xs={6} sm={6} md={3}>
              <AppWidgetSummary
                title="Total Ornaments"
                total={totalOrnaments}
                icon={'mdi:ring'}
                bgColor="#fff"
                iconColor="#8A1B9F"
                textColor="#000"
                onClick={() => navigate('/store/gold-transit')}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Quick Links */}
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

        <Grid container spacing={{ xs: 1.5, sm: 2.5, md: 3 }} sx={{ mb: 4 }}>
          {quickLinks.map((link) => (
            <Grid item xs={6} sm={6} md={3} key={link.title}>
              <Link
                onClick={() => navigate(link.path)}
                underline="none"
                sx={{ cursor: 'pointer' }}
              >
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
