// routes
import Router from './routes';
// theme
import ThemeProvider from './theme';
// components
import ScrollToTop from './components/scroll-to-top';
import { StyledChart } from './components/chart';
import { AttendanceProvider } from './context/AttendanceContext';

// ----------------------------------------------------------------------

export default function App() {
  return (
    <ThemeProvider>
      <AttendanceProvider>
        <ScrollToTop />
      <StyledChart />
      <Router />
      </AttendanceProvider>
    </ThemeProvider>
  );
}