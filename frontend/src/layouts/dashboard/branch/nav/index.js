import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
// @mui
import { styled, alpha } from '@mui/material/styles';
import { Box, Link, Drawer, Typography, Avatar, Stack } from '@mui/material';
// mock
import account from '../../../../_mock/account';
// hooks
import useResponsive from '../../../../hooks/useResponsive';
// components
import Logo from '../../../../components/logo';
import Scrollbar from '../../../../components/scrollbar';
import NavSection from '../../../../components/nav-section';
//
import navConfig from './config';
import global from '../../../../utils/global';

// ----------------------------------------------------------------------

const NAV_WIDTH = 280;

const StyledAccount = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(2, 2.5),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
}));

// ----------------------------------------------------------------------

Nav.propTypes = {
  openNav: PropTypes.bool,
  onCloseNav: PropTypes.func,
};

export default function Nav({ openNav, onCloseNav }) {
  const { pathname } = useLocation();
  const auth = useSelector((state) => state.auth);

  const isDesktop = useResponsive('up', 'lg');

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        bgcolor: '#8A1B9F',
        '& .simplebar-content': { height: 1, display: 'flex', flexDirection: 'column' },
      }}
    >
      <Box sx={{ px: 2.5, py: 3, display: 'inline-flex' }}>
        <Logo />
      </Box>

      <Box sx={{ mb: 5, mx: 2.5 }}>
        <Link underline="none">
          <StyledAccount>
            <Avatar src={account.photoURL} alt="photoURL" />

            <Box sx={{ ml: 2, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ color: '#fff', mb: 0.5 }}>
                {auth.user.username ?? null}
              </Typography>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} noWrap>
                {global.userTypes.find((u) => u.value === auth.user.userType)?.label ?? auth.user.userType}
              </Typography>
            </Box>
          </StyledAccount>
        </Link>
      </Box>

      <NavSection
        data={(() => {
          let data = [...navConfig];
          if (['assistant_branch_manager', 'branch_executive', 'telecalling'].includes(auth.user.userType)) {
            data = data.filter((item) => !['Employee', 'Report', 'Balancesheet', 'Move Gold'].includes(item.title));
          }
          if (auth.user.userType === 'telecalling') {
            const leadsIndex = data.findIndex((i) => i.title === 'Leads');
            if (leadsIndex > -1) {
              const leads = data.splice(leadsIndex, 1)[0];
              data.splice(1, 0, leads);
            }
          }
          return data;
        })()}
      />

      <Box sx={{ flexGrow: 1 }} />
    </Scrollbar>
  );

  return (
    <Box
      component="nav"
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV_WIDTH },
      }}
    >
      {isDesktop ? (
        <Drawer
          open
          variant="permanent"
          PaperProps={{
            sx: {
              width: NAV_WIDTH,
              bgcolor: '#8A1B9F', // Brand Purple
              borderRight: 'none',
            },
          }}
        >
          {renderContent}
        </Drawer>
      ) : (
        <Drawer
          open={openNav}
          onClose={onCloseNav}
          ModalProps={{
            keepMounted: true,
          }}
          PaperProps={{
            sx: { 
              width: NAV_WIDTH,
              bgcolor: '#8A1B9F', // Brand Purple
            },
          }}
        >
          {renderContent}
        </Drawer>
      )}
    </Box>
  );
}
