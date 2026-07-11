import { filter } from 'lodash';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import moment from 'moment';
import {
  Card, Table, Stack, Paper, Button, TableRow, TableBody, TableCell,
  Container, Typography, TableContainer, TablePagination, TableHead, Grid
} from '@mui/material';
import Iconify from '../../../components/iconify';
import Scrollbar from '../../../components/scrollbar';
import { getCampaigns } from '../../../apis/marketing/campaign';

const TABLE_HEAD = [
  { id: 'campaignId', label: 'Campaign ID', alignRight: false },
  { id: 'campaignName', label: 'Name', alignRight: false },
  { id: 'campaignType', label: 'Type', alignRight: false },
  { id: 'campaignStatus', label: 'Status', alignRight: false },
  { id: 'createdAt', label: 'Date', alignRight: false },
  { id: 'actions', label: 'Actions', alignRight: true },
];

export default function CampaignList() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    getCampaigns().then((res) => {
      if (res?.status) {
        setData(res.data);
      }
    });
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - (data?.length || 0)) : 0;

  return (
    <>
      <Helmet>
        <title> Campaigns | MK Gold </title>
      </Helmet>

      <Container maxWidth="xl">
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>
            Campaigns
          </Typography>
          <Button
            variant="contained"
            startIcon={<Iconify icon="eva:plus-fill" />}
            onClick={() => navigate('/marketing/campaigns/new')}
          >
            New Campaign
          </Button>
        </Stack>

        <Grid container spacing={3} mb={5}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'info.main', color: 'white' }}>
              <Typography variant="h6">Total Campaigns</Typography>
              <Typography variant="h4">{data?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'success.main', color: 'white' }}>
              <Typography variant="h6">Active Campaigns</Typography>
              <Typography variant="h4">{data?.filter(c => c.campaignStatus === 'Active')?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'error.main', color: 'white' }}>
              <Typography variant="h6">Paused Campaigns</Typography>
              <Typography variant="h4">{data?.filter(c => c.campaignStatus === 'Paused' || c.campaignStatus === 'paused')?.length || 0}</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 3, textAlign: 'center', bgcolor: 'warning.main', color: 'white' }}>
              <Typography variant="h6">Available Funds</Typography>
              <Typography variant="h4">
                ₹0
              </Typography>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <Scrollbar>
            <TableContainer sx={{ minWidth: 800 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {TABLE_HEAD.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.alignRight ? 'right' : 'left'}
                      >
                        {headCell.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data?.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                    const { _id, campaignId, campaignName, campaignType, campaignStatus, createdAt } = row;
                    return (
                      <TableRow hover key={_id} tabIndex={-1}>
                        <TableCell align="left">{campaignId}</TableCell>
                        <TableCell align="left">{campaignName}</TableCell>
                        <TableCell align="left">{campaignType}</TableCell>
                        <TableCell align="left">{campaignStatus}</TableCell>
                        <TableCell align="left">{moment(createdAt).format('YYYY-MM-DD')}</TableCell>
                        <TableCell align="right">
                          <Button 
                            variant="outlined" 
                            size="small"
                            onClick={() => navigate(`/marketing/campaigns/view/${_id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                  {data?.length === 0 && (
                    <TableRow>
                      <TableCell align="center" colSpan={6} sx={{ py: 3 }}>
                        <Paper sx={{ textAlign: 'center' }}>
                          <Typography paragraph>No campaigns found</Typography>
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
            count={data?.length || 0}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Card>
      </Container>
    </>
  );
}
