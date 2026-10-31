import { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
// @mui
import { Box, List, ListItemText, Collapse, Tooltip } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LockIcon from '@mui/icons-material/Lock';
import { useSelector } from 'react-redux';
import { useAttendance } from '../../context/AttendanceContext';
//
import { StyledNavItem, StyledNavItemIcon } from './styles';

// ----------------------------------------------------------------------

NavSection.propTypes = {
  data: PropTypes.array,
};

export default function NavSection({ data = [], ...other }) {
  return (
    <Box {...other}>
      <List disablePadding sx={{ p: 1 }}>
        {data?.map((item) => (
          <NavItem key={item.title} item={item} />
        ))}
      </List>
    </Box>
  );
}

// ----------------------------------------------------------------------

NavItem.propTypes = {
  item: PropTypes.object,
};

function NavItem({ item }) {
  const { title, path, icon, info, children } = item;
  const { pathname } = useLocation();
  const isActive = path ? pathname.startsWith(path) : false;
  
  const [open, setOpen] = useState(isActive);

  const auth = useSelector((state) => state.auth);
  const { hasMarkedAttendance, attendanceLoading } = useAttendance();

  const isNonAdmin = auth.user?.userType && auth.user?.userType !== 'admin';
  const isAttendanceLocked = isNonAdmin && !attendanceLoading && !hasMarkedAttendance;

  const isAttendanceItem = (targetPath, targetTitle) => {
    const t = (targetTitle || '').toLowerCase();
    const p = (targetPath || '').toLowerCase();
    return t.includes('attendance') || p.endsWith('/attendance');
  };

  const isLocked = isAttendanceLocked && !isAttendanceItem(path, title);

  const handleClick = () => {
    setOpen(!open);
  };

  const activeStyle = {
    color: '#8A1B9F', // Violet
    bgcolor: '#FFD700', // Yellow
    fontWeight: 'fontWeightBold',
    '& .MuiListItemIcon-root': {
      color: '#fff', // White icon
    },
  };

  if (children) {
    const hasAttendanceChild = children.some((c) => isAttendanceItem(c.path, c.title));
    const isParentLocked = isAttendanceLocked && !hasAttendanceChild;

    if (isParentLocked) {
      return (
        <Tooltip title="Punch in attendance today to unlock" placement="right" arrow>
          <Box sx={{ width: '100%' }}>
            <StyledNavItem
              sx={{
                opacity: 0.45,
                cursor: 'not-allowed',
                userSelect: 'none',
                filter: 'grayscale(0.6)',
              }}
            >
              <StyledNavItemIcon>{icon && icon}</StyledNavItemIcon>
              <ListItemText disableTypography primary={title} />
              <LockIcon sx={{ fontSize: 16, ml: 'auto', color: '#ffb74d' }} />
            </StyledNavItem>
          </Box>
        </Tooltip>
      );
    }

    return (
      <>
        <StyledNavItem
          onClick={handleClick}
          sx={{
            ...(isActive && activeStyle),
          }}
        >
          <StyledNavItemIcon>{icon && icon}</StyledNavItemIcon>
          <ListItemText disableTypography primary={title} />
          {info && info}
          {open ? <ExpandLess /> : <ExpandMore />}
        </StyledNavItem>
        
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {children.map((child) => {
              const isChildLocked = isAttendanceLocked && !isAttendanceItem(child.path, child.title);
              if (isChildLocked) {
                return (
                  <Tooltip key={child.title} title="Punch in attendance today to unlock" placement="right" arrow>
                    <Box sx={{ width: '100%' }}>
                      <StyledNavItem
                        sx={{
                          pl: 4,
                          opacity: 0.45,
                          cursor: 'not-allowed',
                          userSelect: 'none',
                          filter: 'grayscale(0.6)',
                        }}
                      >
                        <StyledNavItemIcon>{child.icon && child.icon}</StyledNavItemIcon>
                        <ListItemText disableTypography primary={child.title} />
                        <LockIcon sx={{ fontSize: 14, ml: 'auto', color: '#ffb74d' }} />
                      </StyledNavItem>
                    </Box>
                  </Tooltip>
                );
              }

              return (
                <StyledNavItem
                  key={child.title}
                  component={RouterLink}
                  to={child.path}
                  sx={{
                    pl: 4,
                    '&.active': activeStyle,
                  }}
                >
                  <StyledNavItemIcon>{child.icon && child.icon}</StyledNavItemIcon>
                  <ListItemText disableTypography primary={child.title} />
                </StyledNavItem>
              );
            })}
          </List>
        </Collapse>
      </>
    );
  }

  const navItem = (
    <StyledNavItem
      component={isLocked ? 'div' : RouterLink}
      to={isLocked ? undefined : path}
      sx={{
        '&.active': activeStyle,
        ...(isLocked && {
          opacity: 0.45,
          cursor: 'not-allowed',
          userSelect: 'none',
          filter: 'grayscale(0.6)',
        }),
      }}
    >
      <StyledNavItemIcon>{icon && icon}</StyledNavItemIcon>

      <ListItemText disableTypography primary={title} />

      {isLocked && <LockIcon sx={{ fontSize: 16, ml: 'auto', color: '#ffb74d' }} />}

      {info && info}
    </StyledNavItem>
  );

  if (isLocked) {
    return (
      <Tooltip title="Punch in attendance today to unlock" placement="right" arrow>
        <Box sx={{ width: '100%' }}>{navItem}</Box>
      </Tooltip>
    );
  }

  return navItem;
}
