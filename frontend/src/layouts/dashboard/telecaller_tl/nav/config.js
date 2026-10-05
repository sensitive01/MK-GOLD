import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import GroupsIcon from '@mui/icons-material/Groups';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/telecaller-tl/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Attendance',
    path: '/telecaller-tl/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/telecaller-tl/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Expenses',
    path: '/telecaller-tl/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leads',
    path: '/telecaller-tl/leads',
    icon: <GroupsIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
