import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getTodayAttendanceApi } from '../apis/auth';

const AttendanceContext = createContext({
  hasMarkedAttendance: true,
  attendanceLoading: true,
  attendanceData: null,
  refreshAttendance: () => {},
});

export function AttendanceProvider({ children }) {
  const auth = useSelector((state) => state.auth);
  const [hasMarkedAttendance, setHasMarkedAttendance] = useState(true);
  const [attendanceLoading, setAttendanceLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);

  const checkAttendance = useCallback(async () => {
    if (!auth.isAuthenticated || !auth.user) {
      setHasMarkedAttendance(false);
      setAttendanceLoading(false);
      return;
    }

    // Admin is completely exempt
    if (auth.user?.userType === 'admin') {
      setHasMarkedAttendance(true);
      setAttendanceLoading(false);
      return;
    }

    setAttendanceLoading(true);
    try {
      const res = await getTodayAttendanceApi();
      if (res && res.status) {
        setHasMarkedAttendance(Boolean(res.hasMarkedAttendance));
        setAttendanceData(res.attendance || null);
      } else {
        setHasMarkedAttendance(false);
        setAttendanceData(null);
      }
    } catch (err) {
      console.error('Failed to check today attendance status:', err);
      // On error, default to false for non-admin to ensure security
      setHasMarkedAttendance(false);
    } finally {
      setAttendanceLoading(false);
    }
  }, [auth.isAuthenticated, auth.user]);

  useEffect(() => {
    checkAttendance();
  }, [checkAttendance]);

  return (
    <AttendanceContext.Provider
      value={{
        hasMarkedAttendance,
        attendanceLoading,
        attendanceData,
        refreshAttendance: checkAttendance,
      }}
    >
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  return useContext(AttendanceContext);
}

export default AttendanceContext;

