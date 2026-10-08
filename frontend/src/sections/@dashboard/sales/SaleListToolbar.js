import PropTypes from 'prop-types';
// @mui
import { styled, alpha } from '@mui/material/styles';
import { Toolbar, Tooltip, IconButton, Typography, OutlinedInput, InputAdornment, Box } from '@mui/material';
// component
import Iconify from '../../../components/iconify';
import global from '../../../utils/global';

// ----------------------------------------------------------------------

const StyledRoot = styled(Toolbar)(({ theme }) => ({
  height: 'auto',
  minHeight: 88,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: theme.spacing(1.5, 3),
  gap: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    minHeight: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: theme.spacing(1.5),
    gap: theme.spacing(1.5),
  },
}));

const StyledSearch = styled(OutlinedInput)(({ theme }) => ({
  width: 240,
  transition: theme.transitions.create(['box-shadow', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  '&.Mui-focused': {
    width: 320,
    boxShadow: theme.customShadows.z8,
  },
  [theme.breakpoints.down('md')]: {
    width: '100%',
    '&.Mui-focused': {
      width: '100%',
    },
  },
  '& fieldset': {
    borderWidth: `1px !important`,
    borderColor: `${alpha(theme.palette.grey[500], 0.32)} !important`,
  },
}));

// ----------------------------------------------------------------------

SaleListToolbar.propTypes = {
  handleDelete: PropTypes.func,
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  userType: PropTypes.string,
  children: PropTypes.node,
};

export default function SaleListToolbar({ handleDelete, numSelected, filterName, onFilterName, userType, children }) {
  return (
    <StyledRoot
      sx={{
        ...(numSelected > 0 && {
          color: 'primary.main',
          bgcolor: 'primary.lighter',
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography component="div" variant="subtitle1">
          {numSelected} selected
        </Typography>
      ) : (
        <StyledSearch
          value={filterName}
          onChange={onFilterName}
          placeholder="Search Billing"
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
            </InputAdornment>
          }
        />
      )}

      {numSelected > 0 && global.canDelete(userType) ? (
        <Tooltip title="Delete">
          <IconButton
            onClick={() => {
              handleDelete();
            }}
          >
            <Iconify icon="eva:trash-2-fill" />
          </IconButton>
        </Tooltip>
      ) : children ? (
        <Box sx={{ width: { xs: '100%', md: 'auto' } }}>
          {children}
        </Box>
      ) : null}
    </StyledRoot>
  );
}
