import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

// ----------------------------------------------------------------------

const navConfig = [
  {
    title: 'Attendance',
    path: '/employee/attendance',
    icon: <AccessTimeIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'Leaves',
    path: '/employee/leave',
    icon: <DescriptionIcon sx={{ width: 1, height: 1 }} />,
  },
  {
    title: 'My Tasks',
    path: '/employee/tasks',
    icon: <TaskAltIcon sx={{ width: 1, height: 1 }} />,
  },
];


export default navConfig;
