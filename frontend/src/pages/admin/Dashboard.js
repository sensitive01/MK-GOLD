import { Helmet } from 'react-helmet-async';
// @mui
import { Backdrop, CircularProgress, Container, Grid, Typography, Card, Box } from '@mui/material';

import { useEffect, useState } from 'react';
// sections
import { getCount } from '../../apis/admin/dashboard';
import { AppWidgetSummary } from '../../sections/@dashboard/app';
import Iconify from '../../components/iconify';

// ----------------------------------------------------------------------

export default function DashboardAppPage() {
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
        <title> Dashboard | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Typography variant="h4" sx={{ mb: 5, color: '#fff' }}>
          Hi, Welcome back
        </Typography>

        <Grid container spacing={3}>
          {/* Row 1 */}
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Today's gold rate"
              total={count?.todayGoldRate}
              icon={'mdi:gold'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Today's silver rate"
              total={count?.todaySilverRate}
              icon={'mdi:podium-silver'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Customer Walkins"
              total={count?.todayCustomers}
              icon={'mdi:account-group'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <Card
              sx={{
                p: 2,
                boxShadow: (theme) => theme.customShadows.z8,
                textAlign: 'center',
                color: '#000',
                bgcolor: '#FFD700',
                borderRadius: 2,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 220,
                transition: (theme) => 
                  theme.transitions.create(['transform', 'box-shadow', 'background-color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.02)',
                  boxShadow: (theme) => theme.customShadows.z24,
                  filter: 'brightness(1.1)',
                  cursor: 'pointer',
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Bills
                </Typography>
                <Iconify icon={'mdi:file-document-edit'} width={24} height={24} sx={{ color: '#8A1B9F' }} />
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3">
                  {count?.todayBills || 0}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Physical
                  </Typography>
                  <Typography variant="subtitle1">
                    {count?.todayPhysicalBills || 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Release
                  </Typography>
                  <Typography variant="subtitle1">
                    {count?.todayPledgeBills || 0}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Physical"
              total={count?.todayPhysicalBills}
              icon={'mdi:printer-pos'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Pledged"
              total={count?.todayPledgeBills}
              icon={'mdi:handshake'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>

          {/* Row 2 */}
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Pending Release"
              total={count?.pendingRelease}
              icon={'mdi:clock-outline'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Overall Gross Weight"
              total={count?.totalGrossWeight}
              icon={'mdi:weight'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Overall Net Amount Transferred"
              total={count?.totalNetAmount}
              icon={'mdi:cash-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Sales"
              total={count?.gattySalesCount}
              icon={'mdi:sale'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Fund Inwards"
              total={count?.totalFundsInward}
              icon={'mdi:bank-transfer-in'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          {/* Empty slot for the 6th tile in Row 2 to align properly, or we can just leave it as 5 items in a 6-item grid which will just leave a space at the end. I will leave it empty. */}

          {/* Row 3 */}
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Expenses"
              total={count?.totalExpenses}
              icon={'mdi:wallet'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Overall Leads"
              total={count?.overallLeads}
              icon={'mdi:account-box-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Present"
              total={count?.presentCount}
              icon={'mdi:account-check'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Absent"
              total={count?.absentCount}
              icon={'mdi:account-remove'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Late"
              total={count?.lateCount}
              icon={'mdi:account-clock'}
              bgColor="#FFD700"
              iconColor="#8A1B9F"
              textColor="#000"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Salary Advance"
              total={count?.salaryAdvance}
              icon={'mdi:cash-fast'}
              bgColor="#fff"
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
