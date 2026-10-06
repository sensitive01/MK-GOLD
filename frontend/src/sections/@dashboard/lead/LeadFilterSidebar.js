import PropTypes from 'prop-types';
import { useMemo } from 'react';
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
  FormGroup,
  FormControlLabel,
  Typography,
  Button,
} from '@mui/material';
import Iconify from '../../../components/iconify';

export const STATUS_OPTIONS = ['all', 'pending', 'converted', 'rejected'];
export const CATEGORY_OPTIONS = ['all', 'gold', 'silver'];
export const TYPE_OPTIONS = ['all', 'physical', 'pledged'];
export const EXCLUSIVE_OPTIONS = ['all', 'exclusive'];
export const DEFAULT_SOURCE_OPTIONS = [
  'Google',
  'Facebook',
  'Instagram',
  'Walk-in',
  'Paper Ad',
  'JustDial',
  'Reference',
  'Website',
  'Other',
];

LeadFilterSidebar.propTypes = {
  filters: PropTypes.object,
  setFilters: PropTypes.func,
  userType: PropTypes.string,
  currentTab: PropTypes.string,
  sourceOptions: PropTypes.array,
};

export default function LeadFilterSidebar({ filters, setFilters, userType, currentTab, sourceOptions = [] }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const allSources = useMemo(() => {
    const map = new Map();
    (sourceOptions || []).concat(DEFAULT_SOURCE_OPTIONS).forEach((s) => {
      if (s && typeof s === 'string' && s.trim()) {
        const key = s.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, s.trim());
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [sourceOptions]);

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
            <InputLabel>Source</InputLabel>
            <Select
              name="source"
              value={filters.source || 'all'}
              label="Source"
              onChange={handleChange}
            >
              <MenuItem value="all">All</MenuItem>
              {allSources.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6} md="auto">
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" color="textSecondary">Category</Typography>
            <FormGroup row>
              {['gold', 'silver'].map((option) => (
                <FormControlLabel
                  key={option}
                  control={<Checkbox size="small" checked={(filters.category || []).includes(option)} onChange={(e) => {
                    let newArr = [...(filters.category || [])];
                    if (e.target.checked) newArr.push(option);
                    else newArr = newArr.filter(c => c !== option);
                    setFilters(prev => ({ ...prev, category: newArr }));
                  }} sx={{ py: 0.5 }} />}
                  label={<Typography variant="body2">{option.charAt(0).toUpperCase() + option.slice(1)}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
        </Grid>
        <Grid item xs={12} sm={6} md="auto">
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" color="textSecondary">Type</Typography>
            <FormGroup row>
              {['physical', 'pledged'].map((option) => (
                <FormControlLabel
                  key={option}
                  control={<Checkbox size="small" checked={(filters.type || []).includes(option)} onChange={(e) => {
                    let newArr = [...(filters.type || [])];
                    if (e.target.checked) newArr.push(option);
                    else newArr = newArr.filter(c => c !== option);
                    setFilters(prev => ({ ...prev, type: newArr }));
                  }} sx={{ py: 0.5 }} />}
                  label={<Typography variant="body2">{option.charAt(0).toUpperCase() + option.slice(1)}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>
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
        <Grid item xs={12} sm={6} md="auto">
          {(filters.startDate || filters.endDate || filters.status !== 'all' || (filters.source && filters.source !== 'all') || (filters.category && filters.category.length > 0) || (filters.type && filters.type.length > 0) || filters.isExclusive !== 'all') && (
            <Button
              variant="contained"
              color="error"
              startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
              onClick={() => {
                setFilters({
                  startDate: '', endDate: '', status: 'all', source: 'all', category: [], type: [], isExclusive: 'all'
                });
              }}
              sx={{ height: 40, mt: { xs: 0, md: 'auto' } }}
            >
              Clear Filter
            </Button>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
