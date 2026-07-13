import { useState } from 'react';
import PropTypes from 'prop-types';
import { NavLink as RouterLink, useLocation } from 'react-router-dom';
// @mui
import { Box, List, ListItemText, Collapse } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
            {children.map((child) => (
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
            ))}
          </List>
        </Collapse>
      </>
    );
  }

  return (
    <StyledNavItem
      component={RouterLink}
      to={path}
      sx={{
        '&.active': activeStyle,
      }}
    >
      <StyledNavItemIcon>{icon && icon}</StyledNavItemIcon>

      <ListItemText disableTypography primary={title} />

      {info && info}
    </StyledNavItem>
  );
}

