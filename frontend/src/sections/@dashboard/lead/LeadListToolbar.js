import PropTypes from 'prop-types';
import { styled, alpha } from '@mui/material/styles';
import { Toolbar, Tooltip, IconButton, Typography, OutlinedInput, InputAdornment } from '@mui/material';
import Iconify from '../../../components/iconify';

const StyledRoot = styled(Toolbar)(({ theme }) => ({
  height: 96,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1, 0, 3),
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
  '& fieldset': {
    borderWidth: `1px !important`,
    borderColor: `${alpha(theme.palette.grey[500], 0.32)} !important`,
  },
}));

LeadListToolbar.propTypes = {
  handleDelete: PropTypes.func,
  handleMarkExclusive: PropTypes.func,
  isAllExclusive: PropTypes.bool,
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  filterComponent: PropTypes.node,
};

export default function LeadListToolbar({ handleDelete, handleMarkExclusive, isAllExclusive, numSelected, filterName, onFilterName, filterComponent }) {
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
          placeholder="Search leads..."
          startAdornment={
            <InputAdornment position="start">
              <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
            </InputAdornment>
          }
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center' }}>
        {filterComponent}
        {numSelected > 0 ? (
          <>
            {handleMarkExclusive && (
              <Tooltip title={isAllExclusive ? "Unmark Exclusive" : "Mark Exclusive"}>
                <span>
                  <IconButton onClick={handleMarkExclusive} sx={{ ml: 1, color: 'warning.main' }}>
                    <Iconify icon={isAllExclusive ? "eva:star-outline" : "eva:star-fill"} />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <Tooltip title="Delete">
              <IconButton onClick={handleDelete} sx={{ ml: 1 }}>
                <Iconify icon="eva:trash-2-fill" />
              </IconButton>
            </Tooltip>
          </>
        ) : null}
      </div>
    </StyledRoot>
  );
}
