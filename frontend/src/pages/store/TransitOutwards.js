import { sentenceCase } from 'change-case';
import { filter } from 'lodash';
import { useEffect, useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  Backdrop,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material';

// Components
import Iconify from '../../components/iconify';
import Label from '../../components/label';
import Scrollbar from '../../components/scrollbar';
import { TransitListHead, TransitListToolbar } from '../../sections/@dashboard/transit';
import { findTransit } from '../../apis/admin/transit';
import { findMelting } from '../../apis/admin/melting';
import { getTransitMeltingStatus } from '../../utils/transit';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'transitId', label: 'Transit ID', alignRight: false },
  { id: 'branch', label: 'Origin Branch', alignRight: false },
  { id: 'numberOfPackets', label: 'Packets', alignRight: false },
  { id: 'numberOfOrnaments', label: 'Ornaments', alignRight: false },
  { id: 'totalGrossWeight', label: 'Gross Wt (g)', alignRight: false },
  { id: 'totalNetWeight', label: 'Net Wt (g)', alignRight: false },
  { id: 'deliveryBy', label: 'Dispatched By', alignRight: false },
  { id: 'meltingStatus', label: 'Melting Status', alignRight: false },
  { id: 'createdAt', label: 'Outward Date', alignRight: false },
  { id: 'actions', label: 'Action', alignRight: true },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function getMeltingStageInfo(row) {
  const melt = row?.meltRecord;
  if (!melt) {
    if (getTransitMeltingStatus(row) === 'melted') {
      return { stage: 'completed', label: 'Melt Completed', color: '#7b1fa2' };
    }
    return { stage: 'added', label: 'Added to Melt', color: 'info' };
  }

  if (melt.status === 'sold') {
    return { stage: 'sold', label: 'Bar Sold', color: 'success' };
  }
  if (melt.status === 'melt_updated') {
    return { stage: 'completed', label: 'Melt Completed', color: '#7b1fa2' };
  }
  if (melt.status === 'in_melt' || melt.isPreMeltCompleted) {
    return { stage: 'in_melt', label: 'In Melting', color: '#ed6c02' };
  }
  return { stage: 'added', label: 'Added to Melt', color: 'info' };
}

function applySortFilter(array, comparator, query, filters) {
  const stabilizedThis = array?.map((el, index) => [el, index]) || [];
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filteredData = stabilizedThis?.map((el) => el[0]);

  if (query) {
    filteredData = filter(
      filteredData,
      (row) =>
        row?.transitId?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        row?.branch?.branchName?.toLowerCase().indexOf(query.toLowerCase()) !== -1 ||
        row?.deliveryBy?.toLowerCase().indexOf(query.toLowerCase()) !== -1
    );
  }

  if (filters) {
    if (filters.status && filters.status !== 'all') {
      filteredData = filteredData.filter((row) => getMeltingStageInfo(row).stage === filters.status);
    }
    if (filters.branch && filters.branch !== 'all') {
      filteredData = filteredData.filter((row) => row.branch?.branchName === filters.branch);
    }
    if (filters.fromDate) {
      filteredData = filteredData.filter((row) =>
        moment(row.createdAt).isSameOrAfter(moment(filters.fromDate), 'day')
      );
    }
    if (filters.toDate) {
      filteredData = filteredData.filter((row) =>
        moment(row.createdAt).isSameOrBefore(moment(filters.toDate), 'day')
      );
    }
  }

  return filteredData;
}

export default function StoreTransitOutwards() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [filterName, setFilterName] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Filters
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    status: 'all',
    branch: 'all',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Concurrently fetch transits and melting batches
      const [transitRes, meltingRes] = await Promise.all([
        findTransit({}),
        findMelting({}),
      ]);

      const transits = transitRes?.data || [];
      const melts = meltingRes?.data || [];

      // Build a map of transits that are associated with melting batches
      const meltingMap = new Map();
      melts.forEach((m) => {
        if (m.transitIds && Array.isArray(m.transitIds)) {
          m.transitIds.forEach((t) => {
            const key = typeof t === 'object' ? t?._id?.toString() : t?.toString();
            if (key) meltingMap.set(key, m);
            if (t?.transitId) meltingMap.set(t.transitId, m);
          });
        }
        if (m.transitId) {
          const key = typeof m.transitId === 'object' ? m.transitId?._id?.toString() : m.transitId?.toString();
          if (key) meltingMap.set(key, m);
          if (m.transitId?.transitId) meltingMap.set(m.transitId.transitId, m);
        }
      });

      // Filter transits that were added to melting
      const outwardsTransits = transits.filter((t) => {
        const idKey = t._id ? t._id.toString() : '';
        const transitIdKey = t.transitId || '';
        const inMeltingBatch = meltingMap.has(idKey) || meltingMap.has(transitIdKey);
        const meltingStatus = getTransitMeltingStatus(t);
        return inMeltingBatch || meltingStatus === 'melted' || meltingStatus === 'partial' || t.isMelted || t.status === 'melted';
      }).map((t) => {
        const idKey = t._id ? t._id.toString() : '';
        const transitIdKey = t.transitId || '';
        const meltRecord = meltingMap.get(idKey) || meltingMap.get(transitIdKey);
        return {
          ...t,
          meltRecord,
        };
      });

      setData(outwardsTransits);
    } catch (err) {
      console.error('Error fetching outwards transits:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const handleFilterByName = (event) => {
    setPage(0);
    setFilterName(event.target.value);
  };

  const handleClearFilters = () => {
    setFilters({ fromDate: '', toDate: '', branch: 'all' });
  };

  const isFilterApplied = !!(filters.fromDate || filters.toDate || filters.branch !== 'all');

  const filteredData = applySortFilter(data, getComparator(order, orderBy), filterName, filters);
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;
  const isNotFound = !filteredData?.length && !!filterName;

  // KPI calculations
  const totalOutwardsCount = data.length;
  const totalOrnamentsCount = data.reduce((acc, curr) => acc + (Number(curr.numberOfOrnaments) || 0), 0);
  const totalGrossWeight = data.reduce((acc, curr) => acc + (Number(curr.totalGrossWeight) || 0), 0).toFixed(2);
  const totalNetWeight = data.reduce((acc, curr) => acc + (Number(curr.totalNetWeight) || 0), 0).toFixed(2);

  return (
    <>
      <Helmet>
        <title> Transit Outwards | Store | MK Gold </title>
      </Helmet>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <Container maxWidth="xl">
        {/* Header section */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
          justifyContent="space-between"
          mb={4}
          spacing={2}
        >
          <div>
            <Typography variant="h4" sx={{ color: '#fff' }}>
              Transit Outwards
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
              Track gold transits transferred from store custody to melting
            </Typography>
          </div>

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {isFilterApplied && (
              <Button
                variant="contained"
                color="error"
                startIcon={<Iconify icon="material-symbols:filter-alt-off" />}
                onClick={handleClearFilters}
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Iconify icon="eva:funnel-fill" />}
              onClick={() => setFilterOpen(true)}
              sx={{ bgcolor: '#FFD700', color: '#000', fontWeight: 700, '&:hover': { bgcolor: '#e6c200' } }}
            >
              Filter
            </Button>
          </Stack>
        </Stack>

        {/* KPI Cards Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#ede7f6',
                  color: '#7b1fa2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:fire" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalOutwardsCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Transits in Melting
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#FFD700', color: '#000', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(0,0,0,0.08)',
                  color: '#000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:gold" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalNetWeight} g
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(0,0,0,0.7)', fontWeight: 500 }}>
                  Total Net Gold Outwards
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#e3f2fd',
                  color: '#1976d2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:scale-balance" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalGrossWeight} g
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Gross Weight
                </Typography>
              </div>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, height: '100%', bgcolor: '#fff', boxShadow: 3 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 1.5,
                  bgcolor: '#fff3e0',
                  color: '#e65100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Iconify icon="mdi:ring" width={28} />
              </Box>
              <div>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalOrnamentsCount}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Total Ornaments Dispatched
                </Typography>
              </div>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Info Banner */}
        {isFilterApplied && (
          <Typography variant="body2" sx={{ color: '#fff', mb: 2 }}>
            {[
              filters.fromDate ? `From Date: ${filters.fromDate}` : null,
              filters.toDate ? `To Date: ${filters.toDate}` : null,
              filters.branch !== 'all' ? `Branch: ${filters.branch}` : null,
            ]
              .filter(Boolean)
              .join(' | ')}
          </Typography>
        )}

        {/* Main Card & Table */}
        <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
          <TransitListToolbar
            numSelected={0}
            filterName={filterName}
            onFilterName={handleFilterByName}
          />

          <Scrollbar>
            <TableContainer>
              <Table sx={{ minWidth: 900 }}>
                <TransitListHead
                  order={order}
                  orderBy={orderBy}
                  headLabel={TABLE_HEAD}
                  rowCount={data.length}
                  numSelected={0}
                  onRequestSort={handleRequestSort}
                  hideCheckbox={true}
                />
                <TableBody>
                  {filteredData
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row) => {
                      const {
                        _id,
                        branch,
                        transitId,
                        numberOfPackets,
                        numberOfOrnaments,
                        totalGrossWeight,
                        totalNetWeight,
                        deliveryBy,
                        createdAt,
                        meltRecord,
                      } = row;

                      const meltingStatus = getTransitMeltingStatus(row);
                      const isSold = meltRecord?.status === 'sold';

                      return (
                        <TableRow
                          hover
                          key={_id}
                          tabIndex={-1}
                          sx={{ cursor: 'pointer' }}
                          onClick={() => navigate(`/store/transit-sales/${_id}`)}
                        >
                          <TableCell align="left">
                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1a237e' }}>
                              {transitId}
                            </Typography>
                          </TableCell>

                          <TableCell align="left">
                            <Typography variant="body2">
                              {branch?.branchName || 'N/A'}
                            </Typography>
                            {branch?.branchId && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {branch.branchId}
                              </Typography>
                            )}
                          </TableCell>

                          <TableCell align="left">{numberOfPackets}</TableCell>
                          <TableCell align="left">{numberOfOrnaments}</TableCell>
                          <TableCell align="left">{totalGrossWeight} g</TableCell>
                          <TableCell align="left">
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {totalNetWeight} g
                            </Typography>
                          </TableCell>

                          <TableCell align="left">{sentenceCase(deliveryBy || 'N/A')}</TableCell>

                          <TableCell align="left">
                            {(() => {
                              const info = getMeltingStageInfo(row);
                              if (info.color === 'success' || info.color === 'info') {
                                return <Label color={info.color}>{info.label}</Label>;
                              }
                              return (
                                <Label sx={{ bgcolor: info.color, color: '#fff', fontWeight: 600 }}>
                                  {info.label}
                                </Label>
                              );
                            })()}
                          </TableCell>

                          <TableCell align="left">
                            <Typography variant="body2">{moment(createdAt).format('YYYY-MM-DD')}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {moment(createdAt).format('hh:mm A')}
                            </Typography>
                          </TableCell>

                          <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="View Transit Sales">
                              <IconButton
                                color="primary"
                                onClick={() => navigate(`/store/transit-sales/${_id}`)}
                              >
                                <Iconify icon="carbon:view-filled" width={20} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={10} />
                    </TableRow>
                  )}

                  {filteredData?.length === 0 && !isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 5 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Iconify icon="mdi:fire-off" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
                          <Typography variant="h6" color="text.secondary">
                            No transits in melting
                          </Typography>
                          <Typography variant="body2" color="text.disabled">
                            Transits transferred to melting will be displayed here automatically.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}

                  {isNotFound && (
                    <TableRow>
                      <TableCell align="center" colSpan={10} sx={{ py: 4 }}>
                        <Paper sx={{ textAlign: 'center', boxShadow: 'none' }}>
                          <Typography variant="h6" paragraph>
                            Not found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            No transits found matching &quot;{filterName}&quot;.
                          </Typography>
                        </Paper>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Scrollbar>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={data.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>

      {/* Filter Dialog */}
      <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Filter Outward Transits</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              InputLabelProps={{ shrink: true }}
              value={filters.fromDate || ''}
              onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
            />
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              InputLabelProps={{ shrink: true }}
              value={filters.toDate || ''}
              onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
            />
            <FormControl fullWidth size="small">
              <InputLabel>Melting Stage</InputLabel>
              <Select
                value={filters.status || 'all'}
                label="Melting Stage"
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <MenuItem value="all">All Stages</MenuItem>
                <MenuItem value="added">Added to Melt</MenuItem>
                <MenuItem value="in_melt">In Melting</MenuItem>
                <MenuItem value="completed">Melt Completed</MenuItem>
                <MenuItem value="sold">Bar Sold</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth size="small">
              <InputLabel>Branch</InputLabel>
              <Select
                value={filters.branch}
                label="Branch"
                onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {Array.from(new Set(data.map((item) => item.branch?.branchName))).filter(Boolean).map((branch) => (
                  <MenuItem key={branch} value={branch}>
                    {branch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={handleClearFilters} color="inherit">Reset</Button>
          <Button onClick={() => setFilterOpen(false)} variant="contained">Apply</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
