import { Helmet } from 'react-helmet-async';
import { useSelector } from 'react-redux';
// @mui
import { Container, Grid, Link, Typography, Stack } from '@mui/material';
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
        </Stack>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Link href="/transaction-executive/fund" underline="none">
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
            <Link href="/transaction-executive/leave" underline="none">
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
            <Link href="/transaction-executive/attendance" underline="none">
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

          <Grid item xs={12} sm={6} md={3}>
            <Link href="/transaction-executive/release" underline="none">
              <AppWidgetSummary
                title="Release"
                total={false}
                icon={'mdi:clock-check'}
                bgColor="#fff"
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
