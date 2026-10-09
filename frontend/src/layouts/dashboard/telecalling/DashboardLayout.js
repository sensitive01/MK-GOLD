import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
// @mui
import { styled } from '@mui/material/styles';
//
import Header from './header';
import Nav from './nav';
import { NotificationDisplay } from '../../../components/announcement';
import { getProfileApi } from '../../../apis/auth';
import { logout } from '../../../features/authSlice';

// ----------------------------------------------------------------------

const APP_BAR_MOBILE = 64;
const APP_BAR_DESKTOP = 92;

const StyledRoot = styled('div')({
  display: 'flex',
  minHeight: '100%',
  overflow: 'hidden',
});

const Main = styled('div')(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  minHeight: '100%',
  paddingTop: APP_BAR_MOBILE + 24,
  paddingBottom: theme.spacing(10),
  [theme.breakpoints.up('lg')]: {
    paddingTop: APP_BAR_DESKTOP + 24,
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  },
}));

// ----------------------------------------------------------------------

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkActiveSession = async () => {
      try {
        const res = await getProfileApi();
        if (!isMounted) return;

        // If response indicates account is not active, force immediate logout
        if (res && res.status === true && res.data && res.data.status !== 'active') {
          dispatch(logout());
          localStorage.removeItem('token');
          localStorage.removeItem('persist:root');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        if (!isMounted) return;
        if (err?.response?.status === 401) {
          dispatch(logout());
          localStorage.removeItem('token');
          localStorage.removeItem('persist:root');
          navigate('/login', { replace: true });
        }
      }
    };

    // Run check immediately and then periodically every 8 seconds
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 8000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dispatch, navigate]);

  return (
    <>
      <NotificationDisplay />
      <StyledRoot sx={{ display: 'flex' }}>
        <Header onOpenNav={() => setOpen(true)} />

        <Nav openNav={open} onCloseNav={() => setOpen(false)} />

        <Main>
          <Outlet />
        </Main>
      </StyledRoot>
    </>
  );
}
