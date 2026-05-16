import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableHead,
  Paper,
  Stack,
} from '@mui/material';
import moment from 'moment';
import { sentenceCase } from 'change-case';

export default function TimelineView({ timeline }) {
  if (!timeline || timeline.length === 0) {
    return (
      <Typography variant="body2" sx={{ p: 3, fontStyle: 'italic', color: 'text.secondary' }}>
        No timeline data available for this record.
      </Typography>
    );
  }

  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return 'N/A';
    if (seconds < 0) return '0s';
    
    const duration = moment.duration(seconds, 'seconds');
    const days = Math.floor(duration.asDays());
    const hours = duration.hours();
    const minutes = duration.minutes();
    const secs = duration.seconds();

    let res = '';
    if (days > 0) res += `${days}d `;
    if (hours > 0) res += `${hours}h `;
    if (minutes > 0) res += `${minutes}m `;
    if (secs > 0 || res === '') res += `${secs}s`;
    return res.trim();
  };

  const totalTime = timeline.reduce((acc, curr) => acc + (curr.timeTaken || 0), 0);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ color: 'primary.main' }}>Process Timeline & Stage Logs</Typography>
        <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', bgcolor: 'primary.lighter', px: 2, py: 0.5, borderRadius: 1 }}>
          Overall Process Time: {formatDuration(totalTime)}
        </Typography>
      </Stack>
      
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>No.</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Stage / Event</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Performed By</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Timestamp</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Details</TableCell>
              <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Time Taken (TTL)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {timeline.map((item, index) => (
              <TableRow key={index} hover>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {sentenceCase(item.event || '')}
                    </Typography>
                </TableCell>
                <TableCell>
                  {item.performerName?.name ? (
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{item.performerName.name}</Typography>
                      {item.performerName.employeeId && (
                        <Typography variant="caption" display="block" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                          ID: {item.performerName.employeeId}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        {item.event === 'Enquiry Raised' ? 'Customer (Online)' : 'System'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                    {moment(item.performedAt).format('YYYY-MM-DD')}
                    <Typography variant="caption" display="block" color="text.secondary">
                        {moment(item.performedAt).format('HH:mm:ss')}
                    </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 200, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                  {item.details || '-'}
                </TableCell>
                <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'info.main' }}>
                        {formatDuration(item.timeTaken)}
                    </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Box sx={{ mt: 2, p: 1.5, bgcolor: 'info.lighter', borderRadius: 1, borderLeft: '4px solid', borderLeftColor: 'info.main' }}>
        <Typography variant="caption" display="block" color="info.darker">
          <strong>Note:</strong> TTL (Time to Complete) shows the duration taken from the previous stage to reach this stage.
        </Typography>
      </Box>
    </Box>
  );
}

TimelineView.propTypes = {
  timeline: PropTypes.array,
};
