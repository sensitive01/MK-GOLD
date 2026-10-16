import AssessmentIcon from '@mui/icons-material/Assessment';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/store/dashboard',
    icon: icon('ic_analytics'),
  },
  // {
  //   title: 'Transit',
  //   path: '/store/transit',
  //   icon: <AssessmentIcon sx={{ width: 1, height: 1 }} />,
  // },
  {
    title: 'Inward Transit',
    path: '/store/gold-transit',
    icon: <MoveToInboxIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Transit Outwards',
    path: '/store/transit-outwards',
    icon: <FlightTakeoffIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Attendance',
    path: '/store/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/store/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
