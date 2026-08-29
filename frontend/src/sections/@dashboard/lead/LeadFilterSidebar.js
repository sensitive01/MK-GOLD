import PropTypes from 'prop-types';
import {
  Box,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
} from '@mui/material';

export const STATUS_OPTIONS = ['all', 'pending', 'converted', 'rejected'];
export const CATEGORY_OPTIONS = ['all', 'gold', 'silver'];
export const TYPE_OPTIONS = ['all', 'physical', 'pledged'];
export const EXCLUSIVE_OPTIONS = ['all', 'exclusive'];

LeadFilterSidebar.propTypes = {
  filters: PropTypes.object,
  setFilters: PropTypes.func,
  userType: PropTypes.string,
  currentTab: PropTypes.string,
};

export default function LeadFilterSidebar({ filters, setFilters, userType, currentTab }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={6} md={2}>
          <TextField
            fullWidth
            size="small"
            type="date"
            label="From Date"
            InputLabelProps={{ shrink: true }}
            name="startDate"
            value={filters.startDate}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
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
        </Grid>
        {!['pending', 'converted', 'rejected'].includes(currentTab) && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                label="Status"
                onChange={handleChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select
              multiple
              name="category"
              value={filters.category || []}
              label="Category"
              onChange={handleChange}
              renderValue={(selected) => selected.length === 0 ? 'All' : selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
            >
              {['gold', 'silver'].map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={(filters.category || []).indexOf(option) > -1} />
                  <ListItemText primary={option.charAt(0).toUpperCase() + option.slice(1)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Type</InputLabel>
            <Select
              multiple
              name="type"
              value={filters.type || []}
              label="Type"
              onChange={handleChange}
              renderValue={(selected) => selected.length === 0 ? 'All' : selected.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')}
            >
              {['physical', 'pledged'].map((option) => (
                <MenuItem key={option} value={option}>
                  <Checkbox checked={(filters.type || []).indexOf(option) > -1} />
                  <ListItemText primary={option.charAt(0).toUpperCase() + option.slice(1)} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {userType?.toLowerCase() !== 'telecalling' && (
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Hot Leads</InputLabel>
              <Select
                name="isExclusive"
                value={filters.isExclusive}
                label="Hot Leads"
                onChange={handleChange}
              >
                {EXCLUSIVE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option === 'all' ? 'All Leads' : 'Hot Leads Only'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
