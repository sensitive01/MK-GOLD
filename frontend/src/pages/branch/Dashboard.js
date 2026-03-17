import { Helmet } from 'react-helmet-async';
// @mui
import { Container, Grid, Link, Typography } from '@mui/material';
// sections
import { AppWidgetSummary } from '../../sections/@dashboard/app';

// ----------------------------------------------------------------------

export default function DashboardAppPage() {

  return (
    <>
      <Helmet>
        <title> Dashboard | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Hi, Welcome back
        </Typography>

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

          {/* <Grid item xs={12} md={6} lg={8}>
            <AppWebsiteVisits
              title="Website Visits"
              subheader="(+43%) than last year"
              chartLabels={[
                '01/01/2003',
                '02/01/2003',
                '03/01/2003',
                '04/01/2003',
                '05/01/2003',
                '06/01/2003',
                '07/01/2003',
                '08/01/2003',
                '09/01/2003',
                '10/01/2003',
                '11/01/2003',
              ]}
              chartData={[
                {
                  name: 'Team A',
                  type: 'column',
                  fill: 'solid',
                  data: [23, 11, 22, 27, 13, 22, 37, 21, 44, 22, 30],
                },
                {
                  name: 'Team B',
                  type: 'area',
                  fill: 'gradient',
                  data: [44, 55, 41, 67, 22, 43, 21, 41, 56, 27, 43],
                },
                {
                  name: 'Team C',
                  type: 'line',
                  fill: 'solid',
                  data: [30, 25, 36, 30, 45, 35, 64, 52, 59, 36, 39],
                },
              ]}
            />
          </Grid>

          <Grid item xs={12} md={6} lg={4}>
            <AppCurrentVisits
              title="Current Visits"
              chartData={[
                { label: 'America', value: 4344 },
                { label: 'Asia', value: 5435 },
                { label: 'Europe', value: 1443 },
                { label: 'Africa', value: 4443 },
              ]}
              chartColors={[
                theme.palette.primary.main,
                theme.palette.info.main,
                theme.palette.warning.main,
                theme.palette.error.main,
              ]}
            />
          </Grid> */}
        </Grid>
      </Container>
    </>
  );
}
