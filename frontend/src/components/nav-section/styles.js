// @mui
import { styled } from '@mui/material/styles';
import { ListItemIcon, ListItemButton } from '@mui/material';

// ----------------------------------------------------------------------

export const StyledNavItem = styled((props) => <ListItemButton disableGutters {...props} />)(({ theme }) => ({
  ...theme.typography.body2,
  height: 48,
  position: 'relative',
  textTransform: 'capitalize',
  color: 'rgba(255, 255, 255, 0.9)', // White text
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(1),
  '&:hover': {
    backgroundColor: '#FFD700', // Yellow
    color: '#8A1B9F', // Violet
    '& .MuiListItemIcon-root': {
      color: '#fff', // White icon on yellow background
    },
  },
}));

export const StyledNavItemIcon = styled(ListItemIcon)({
  width: 22,
  height: 22,
  color: '#FFD700', // Secondary Yellow
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
