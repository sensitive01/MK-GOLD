import { Helmet } from 'react-helmet-async';
// @mui
import { Box, Container, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
// hooks
import useResponsive from '../hooks/useResponsive';
// components
// sections
import { LoginForm } from '../sections/auth/login';

// ----------------------------------------------------------------------

const StyledRoot = styled('div')(({ theme }) => ({
  [theme.breakpoints.up('md')]: {
    display: 'flex',
    minHeight: '100vh',
  },
  backgroundColor: '#f4f6f8',
}));

const StyledSection = styled('div')(({ theme }) => ({
  width: '100%',
  maxWidth: 480,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  backgroundColor: '#8A1B9F', // Brand Purple
  color: '#fff',
  padding: theme.spacing(0, 5),
  textAlign: 'center',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)',
  },
}));

const StyledContent = styled('div')(({ theme }) => ({
  maxWidth: 480,
  margin: 'auto',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  flexDirection: 'column',
  padding: theme.spacing(12, 0),
}));

// ----------------------------------------------------------------------

export default function LoginPage() {
  const mdUp = useResponsive('up', 'md');

  return (
    <>
      <Helmet>
        <title> Login | MK Gold World </title>
      </Helmet>

      <StyledRoot>
        {mdUp && (
          <StyledSection>
            <Typography variant="h3" sx={{ px: 5, mt: 10, mb: 2, fontWeight: 'bold' }}>
              MK Gold World
            </Typography>
            <Typography variant="body1" sx={{ px: 5, mb: 5, opacity: 0.8 }}>
              The most trusted and transparent billing solution for your gold business.
            </Typography>
            <Box
              component="img"
              src="/newLogo.jpeg"
              alt="Logo"
              sx={{
                width: 200,
                mx: 'auto',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
                border: '4px solid #FFD700', // Brand Yellow/Gold
              }}
            />
            <Typography variant="h6" sx={{ mt: 5, color: '#FFD700', fontWeight: 'bold' }}>
              TRUE • TRUSTED • TRANSPARENT
            </Typography>
          </StyledSection>
        )}

        <Container maxWidth="sm">
          <StyledContent>
            <Box
              sx={{
                p: 4,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: (theme) => theme.customShadows.z24,
                textAlign: 'center',
              }}
            >
              <Box
                component="div"
                sx={{
                  width: 80,
                  height: 80,
                  display: 'inline-flex',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <img alt="Logo" src="/newLogo.jpeg" style={{ borderRadius: '8px' }} />
              </Box>
              
              <Typography variant="h4" gutterBottom sx={{ mb: 1, color: '#8A1B9F' }}>
                Sign in to Continue
              </Typography>
              <Typography variant="body2" sx={{ mb: 4, color: 'text.secondary' }}>
                Enter your details below to access your account.
              </Typography>

              <LoginForm />

              <Box sx={{ mt: 3 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Don’t have an account?{' '}
                  <Box component="span" sx={{ color: '#8A1B9F', fontWeight: 'bold', cursor: 'pointer' }}>
                    Contact Administrator
                  </Box>
                </Typography>
              </Box>
            </Box>
          </StyledContent>
        </Container>
      </StyledRoot>
    </>
  );
}
