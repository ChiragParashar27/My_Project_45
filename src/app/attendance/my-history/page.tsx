// src/app/attendance/my-history/page.tsx
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import moment from 'moment';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string; // LocalDate
  checkIn: string; // LocalDateTime
  checkOut: string | null; // LocalDateTime
}

const AttendanceHistoryContent = () => {
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        // Backend endpoint: /api/attendance/history
        const response = await apiClient.get<AttendanceRecord[]>('/attendance/history');
        setHistory(response.data.reverse()); // Show most recent first
      } catch (err) {
        setError('Failed to fetch attendance history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const calculateDuration = (checkIn: string, checkOut: string | null): string => {
    if (!checkOut) return 'N/A';
    const start = moment(checkIn);
    const end = moment(checkOut);
    const duration = moment.duration(end.diff(start));
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    
    return `${hours}h ${minutes}m`;
  };

  if (loading) return <div>Loading attendance history...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Attendance History</h1>
      
      {history.length === 0 ? (
        <p>No attendance records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {history.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{moment(record.date).format('MMM D, YYYY')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(record.checkIn).format('HH:mm:ss A')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.checkOut ? moment(record.checkOut).format('HH:mm:ss A') : <span className="text-yellow-600 font-semibold">In Progress</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {calculateDuration(record.checkIn, record.checkOut)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default function AttendanceHistoryPage() {
    // Need moment for time calculations
    // npm install moment
    return (
        <ProtectedRoute requiredRole='EMPLOYEE'>
            <AttendanceHistoryContent />
        </ProtectedRoute>
    );
}