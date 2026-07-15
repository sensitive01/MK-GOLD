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
import QrCodeIcon from '@mui/icons-material/QrCode';
import StoreIcon from '@mui/icons-material/Store';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import SettingsIcon from '@mui/icons-material/Settings';
// component
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/admin/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Gold-Rate',
    path: '/admin/gold-rate',
    icon: <MonetizationOnIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Branch',
    path: '/admin/branch',
    icon: <HomeWorkIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Employees',
    icon: icon('ic_user'),
    children: [
      {
        title: 'Attendances',
        path: '/admin/employee/attendance',
        icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Leaves',
        path: '/admin/employee/leave',
        icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Employees',
        path: '/admin/employee/details',
        icon: icon('ic_user'),
      },
      {
        title: 'Users',
        path: '/admin/employee/user',
        icon: icon('ic_user'),
      },
    ]
  },
  {
    title: 'Billing',
    icon: <SellIcon sx={{ width: 1, height: 1 }} />,
    children: [
      {
        title: 'Transit',
        path: '/admin/transit',
        icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Report',
        path: '/admin/report',
        icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Purchases',
        path: '/admin/purchase',
        icon: <StoreIcon sx={{ width: 1, height: 1 }} />,
      }
    ]
  },
  {
    title: 'Expenses',
    path: '/admin/expense',
    icon: <RequestQuoteIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Funds',
    path: '/admin/fund',
    icon: <AttachMoneyIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Sell Gold',
    path: '/admin/sell-gold',
    icon: <PointOfSaleIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leads',
    path: '/admin/leads',
    icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Marketing',
    path: '/admin/marketing',
    icon: <CampaignIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Announcement',
    path: '/admin/announcement',
    icon: <CampaignIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Settings',
    icon: <SettingsIcon sx={{ width: 1, height: 1 }} />,
    children: [
      {
        title: 'General Settings',
        path: '/admin/settings',
        icon: <SettingsIcon sx={{ width: 1, height: 1 }} />,
      },
      /*
      {
        title: 'Support',
        path: '/admin/support',
        icon: <SupportAgentIcon sx={{ width: 1, height: 1 }} />,
      },
      {
        title: 'Move Gold',
        path: '/admin/ornament',
        icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
      },
      */
      {
        title: 'Balancesheet',
        path: '/admin/balancesheet',
        icon: <RequestPageIcon sx={{ width: 1, height: 1 }} />,
      },
    ]
  },
];

export default navConfig;
