import { useState } from 'react';
// @mui
import { styled } from '@mui/material/styles';
import { Input, Slide, Button, IconButton, InputAdornment, ClickAwayListener } from '@mui/material';
// utils
import { bgBlur } from '../../../../utils/cssStyles';
// component
import Iconify from '../../../../components/iconify';

// ----------------------------------------------------------------------

const HEADER_MOBILE = 64;
const HEADER_DESKTOP = 92;

const StyledSearchbar = styled('div')(({ theme }) => ({
  ...bgBlur({ color: '#711683' }),
  top: 0,
  left: 0,
  zIndex: 99,
  width: '100%',
  display: 'flex',
  position: 'absolute',
  alignItems: 'center',
  height: HEADER_MOBILE,
  padding: theme.spacing(0, 1.5),
  boxShadow: theme.customShadows.z8,
  [theme.breakpoints.up('sm')]: {
    padding: theme.spacing(0, 3),
  },
  [theme.breakpoints.up('md')]: {
    height: HEADER_DESKTOP,
    padding: theme.spacing(0, 5),
  },
}));

// ----------------------------------------------------------------------

export default function Searchbar() {
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ClickAwayListener onClickAway={handleClose}>
      <div>
        {!open && (
          <IconButton onClick={handleOpen} sx={{ color: 'white' }}>
            <Iconify icon="eva:search-fill" />
          </IconButton>
        )}

        <Slide direction="down" in={open} mountOnEnter unmountOnExit>
          <StyledSearchbar>
            <Input
              autoFocus
              fullWidth
              disableUnderline
              placeholder="Search…"
              startAdornment={
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ color: 'rgba(255, 255, 255, 0.7)', width: 20, height: 20 }} />
                </InputAdornment>
              }
              sx={{
                mr: 1,
                fontWeight: 'fontWeightBold',
                color: '#fff',
                bgcolor: 'rgba(255, 255, 255, 0.12)',
                borderRadius: 1,
                px: 1.5,
                py: 0.5,
                '& input::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  opacity: 1,
                },
              }}
            />
            <Button
              variant="contained"
              onClick={handleClose}
              sx={{
                bgcolor: '#FFD700',
                color: '#8A1B9F',
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#ffae00' },
              }}
            >
              Search
            </Button>
          </StyledSearchbar>
        </Slide>
      </div>
    </ClickAwayListener>
  );
}
