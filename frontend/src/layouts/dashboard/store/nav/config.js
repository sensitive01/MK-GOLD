import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import SvgColor from '../../../../components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />;

const navConfig = [
  {
    title: 'Dashboard',
    path: '/store/dashboard',
    icon: icon('ic_analytics'),
  },
  {
    title: 'Transit',
    path: '/store/gold-transit',
    icon: <LocalShippingIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Transit Outwards',
    path: '/store/transit-outwards',
    icon: <FlightTakeoffIcon sx={{ width: 1, height: 1 }} />,
  },
];

export default navConfig;
