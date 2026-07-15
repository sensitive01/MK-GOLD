import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  IconButton,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl
} from '@mui/material';
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';

export const STATUS_OPTIONS = ['all', 'pending', 'converted', 'rejected'];
export const CATEGORY_OPTIONS = ['all', 'gold', 'silver'];
export const TYPE_OPTIONS = ['all', 'physical', 'pledged'];
export const EXCLUSIVE_OPTIONS = ['all', 'exclusive'];

LeadFilterSidebar.propTypes = {
  openFilter: PropTypes.bool,
  onOpenFilter: PropTypes.func,
  onCloseFilter: PropTypes.func,
  filters: PropTypes.object,
  setFilters: PropTypes.func,
};

export default function LeadFilterSidebar({ openFilter, onOpenFilter, onCloseFilter, filters, setFilters }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: 'all',
      category: 'all',
      type: 'all',
      isExclusive: 'all'
    });
  };

  return (
    <>
      <Button disableRipple color="inherit" endIcon={<Iconify icon="ic:round-filter-list" />} onClick={onOpenFilter}>
        Filters&nbsp;
      </Button>

      <Dialog
        open={openFilter}
        onClose={onCloseFilter}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Filters
          <IconButton onClick={onCloseFilter} size="small">
            <Iconify icon="eva:close-fill" />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            <div>
              <Typography variant="subtitle1" gutterBottom>
                Date Range
              </Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From Date"
                InputLabelProps={{ shrink: true }}
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To Date"
                InputLabelProps={{ shrink: true }}
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
              />
            </div>

            <div>
              <Typography variant="subtitle1" gutterBottom>
                Status
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleChange}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <Typography variant="subtitle1" gutterBottom>
                Category
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="category"
                  value={filters.category}
                  onChange={handleChange}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <Typography variant="subtitle1" gutterBottom>
                Type
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="type"
                  value={filters.type}
                  onChange={handleChange}
                >
                  {TYPE_OPTIONS.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div>
              <Typography variant="subtitle1" gutterBottom>
                Exclusive Leads
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  name="isExclusive"
                  value={filters.isExclusive || 'all'}
                  onChange={handleChange}
                >
                  {EXCLUSIVE_OPTIONS.map((opt) => (
                    <MenuItem key={opt} value={opt}>
                      {opt === 'all' ? 'All Leads' : 'Exclusive Only'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>
          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button
            fullWidth
            size="large"
            type="submit"
            color="inherit"
            variant="outlined"
            startIcon={<Iconify icon="ic:round-clear-all" />}
            onClick={handleReset}
          >
            Clear All
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
