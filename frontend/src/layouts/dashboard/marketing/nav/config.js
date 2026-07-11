import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import DescriptionIcon from '@mui/icons-material/Description';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import SellIcon from '@mui/icons-material/Sell';
import SafetyCheckIcon from '@mui/icons-material/SafetyCheck';
import RequestPageIcon from '@mui/icons-material/RequestPage';
import CampaignIcon from '@mui/icons-material/Campaign';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import GroupsIcon from '@mui/icons-material/Groups';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/marketing/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Attendance',
    path: '/marketing/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/marketing/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Expenses',
    path: '/marketing/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Campaigns',
    path: '/marketing/campaigns',
    icon: <CampaignIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Calendar',
    path: '/marketing/calendar',
    icon: <CalendarMonthIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leads',
    path: '/marketing/leads',
    icon: <GroupsIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
