import { Helmet } from 'react-helmet-async';
// @mui
import { Backdrop, CircularProgress, Container, Grid, Typography, Card, Box } from '@mui/material';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
// sections
import { getCount } from '../../apis/admin/dashboard';
import { AppWidgetSummary } from '../../sections/@dashboard/app';
import { fShortenNumber } from '../../utils/formatNumber';
import Iconify from '../../components/iconify';

// ----------------------------------------------------------------------

export default function DashboardAppPage() {
  const navigate = useNavigate();
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
              disableShorten={true}
              onClick={() => navigate('/admin/gold-rate')}
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
              disableShorten={true}
              onClick={() => navigate('/admin/gold-rate')}
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
              onClick={() => navigate('/admin/customer')}
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
                minHeight: { xs: 145, sm: 180, md: 220 },
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
              onClick={() => navigate('/admin/sale')}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Bills
                </Typography>
                <Iconify icon={'mdi:file-document-edit'} width={24} height={24} sx={{ color: '#8A1B9F' }} />
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }, fontWeight: 700 }}>
                  {count?.todayBills || 0}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Physical
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {count?.todayPhysicalBills || 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Release
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {count?.todayPledgeBills || 0}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Pending Release"
              total={count?.pendingRelease}
              icon={'mdi:clock-outline'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin/release')}
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
              onClick={() => navigate('/admin/sale')}
            />
          </Grid>

          {/* Row 2 */}
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Overall Net Amount Transferred"
              total={count?.totalNetAmount}
              icon={'mdi:cash-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin/fund')}
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
              onClick={() => navigate('/admin/sale')}
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
              onClick={() => navigate('/admin/fund')}
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
                minHeight: { xs: 145, sm: 180, md: 220 },
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
              onClick={() => navigate('/admin/expense')}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Fund Outwards
                </Typography>
                <Iconify icon={'mdi:bank-transfer-out'} width={24} height={24} sx={{ color: '#8A1B9F' }} />
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }, fontWeight: 700 }}>
                  {fShortenNumber((count?.totalExpenses || 0) + (count?.salaryAdvance || 0))}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Expenses
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {fShortenNumber(count?.totalExpenses || 0)}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Advance
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {fShortenNumber(count?.salaryAdvance || 0)}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <AppWidgetSummary
              title="Overall Leads"
              total={count?.overallLeads}
              icon={'mdi:account-box-multiple'}
              bgColor="#fff"
              iconColor="#8A1B9F"
              textColor="#000"
              onClick={() => navigate('/admin/leads')}
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
                minHeight: { xs: 145, sm: 180, md: 220 },
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
              onClick={() => navigate('/admin/employee/attendance')}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
                  Present
                </Typography>
                <Iconify icon={'mdi:account-check'} width={24} height={24} sx={{ color: '#8A1B9F' }} />
              </Box>
              
              <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.125rem' }, fontWeight: 700 }}>
                  {count?.presentCount || 0}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, pt: 2, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Absent
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {count?.absentCount || 0}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center', width: '50%' }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 0.5 }}>
                    Late
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {count?.lateCount || 0}
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </Container>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={openBackdrop}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </>
  );
}
