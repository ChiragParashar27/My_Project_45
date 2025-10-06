// src/app/dashboard/page.tsx - RE-WRITTEN
'use client';

import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';
import moment from 'moment';

// --- ASSUMED INTERFACE ---
interface AttendanceStatus {
    checkIn: string;
    checkOut: string | null;
    isClockedIn: boolean;
}
// --- END ASSUMED INTERFACE ---

const AttendanceWidget = () => {
    const [status, setStatus] = useState<AttendanceStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);

    const fetchAttendanceStatus = async () => {
        try {
            const history = await apiClient.get<any[]>('/attendance/history'); 
            const todayRecord = history.data.find(r => moment(r.date).isSame(moment(), 'day'));
            
            if (todayRecord) {
                setStatus({
                    checkIn: todayRecord.checkIn,
                    checkOut: todayRecord.checkOut,
                    isClockedIn: todayRecord.checkOut === null
                });
            } else {
                setStatus({ checkIn: '', checkOut: null, isClockedIn: false });
            }
        } catch (e) {
            console.error("Failed to fetch attendance status", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceStatus();
    }, []);

    const handleAction = async (action: 'check-in' | 'check-out') => {
        setMessage(null);
        try {
            const response = await apiClient.post(`/attendance/${action}`, {});
            setMessage(response.data);
            await fetchAttendanceStatus();
        } catch (err: any) {
            setMessage(err.response?.data || `Failed to ${action}.`);
        }
    };

    if (loading) return <div>Loading status...</div>;
    
    // Safety checks for logic: status is not null
    const isClockedOut = status && status.checkOut !== null;
    const isClockedIn = status && status.checkIn && !isClockedOut;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-xl font-bold mb-4">Today's Attendance</h2>
            {message && (
                <div className={`mb-3 p-2 rounded text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}
            
            <p className="mb-2">
                **Check-In:** {status?.checkIn ? moment(status.checkIn).format('HH:mm:ss A') : 'N/A'}
            </p>
            <p className="mb-4">
                **Check-Out:** {status?.checkOut ? moment(status.checkOut).format('HH:mm:ss A') : 'N/A'}
            </p>

            <div className="flex space-x-4">
                <button
                    onClick={() => handleAction('check-in')}
                    // ✅ FIX TS2322: Use !! to guarantee boolean type
                    disabled={!!(isClockedIn || isClockedOut)}
                    className={`flex-1 py-2 rounded transition-colors ${!isClockedIn && !isClockedOut ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                >
                    Check In
                </button>
                <button
                    onClick={() => handleAction('check-out')}
                    // ✅ FIX TS2322: Use !! to guarantee boolean type
                    disabled={!!(!isClockedIn || isClockedOut)}
                    className={`flex-1 py-2 rounded transition-colors ${isClockedIn && !isClockedOut ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-400 text-gray-700 cursor-not-allowed'}`}
                >
                    Check Out
                </button>
            </div>
        </div>
    );
};

const DashboardContent = () => {
    const { user, role } = useAuthStore();
    
    return (
        <div className="space-y-8">
            <h1 className="text-4xl font-extrabold text-gray-900">Welcome, {user?.name}!</h1>
            <p className="text-lg text-gray-600">Your role: **{role}**</p>

            {/* Quick Stats/Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AttendanceWidget />
                
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                    <ul className="space-y-2 text-indigo-600">
                        <li><a href="/leaves/apply" className="hover:underline">Apply for Leave</a></li>
                        <li><a href="/payroll/my-payrolls" className="hover:underline">View Last Salary Slip</a></li>
                        <li><a href="/chat" className="hover:underline">Join Global Chat</a></li>
                    </ul>
                </div>

                {role === 'ADMIN' && (
                    <div className="bg-white p-6 rounded-lg shadow-md border border-indigo-500">
                        <h2 className="text-xl font-bold mb-4 text-indigo-700">Admin Panel</h2>
                        <ul className="space-y-2 text-indigo-600">
                            <li><a href="/admin/users" className="hover:underline">Manage Users</a></li>
                            <li>
                                <a href="/leaves/review" className="hover:underline">
                                    {/* ✅ FIX TS2367: Simplified label as block is already restricted to ADMIN */}
                                    Review Leaves (All Requests)
                                </a>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function DashboardPage() {
    return (
        <ProtectedRoute requiredRole='EMPLOYEE'>
            <DashboardContent />
        </ProtectedRoute>
    );
}