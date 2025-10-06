// src/app/leaves/my-requests/page.tsx
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LeaveRequest, LeaveStatus, LeaveType } from '@/types/leave';
import moment from 'moment';

const ApplyLeaveForm = ({ onLeaveSubmitted }: { onLeaveSubmitted: () => void }) => {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [type, setType] = useState<LeaveType>(LeaveType.CASUAL);
    const [reason, setReason] = useState('');
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (moment(startDate).isAfter(moment(endDate))) {
            setMessage("End Date must be after Start Date.");
            return;
        }

        try {
            // Backend endpoint: /api/leaves/apply
            const response = await apiClient.post('/leaves/apply', {
                startDate, endDate, type, reason
            });
            setMessage(response.data);
            setReason('');
            onLeaveSubmitted(); // Refresh history
        } catch (error: any) {
            setMessage(error.response?.data || "Failed to submit leave request.");
            console.error(error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg shadow-inner bg-gray-50 space-y-4">
            <h3 className="text-xl font-semibold mb-2">Apply for Leave</h3>
            {message && <p className={`text-sm ${message.includes('successful') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium">Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
                <div>
                    <label className="block text-sm font-medium">End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required className="w-full mt-1 px-3 py-2 border rounded-md" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium">Leave Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as LeaveType)} required className="w-full mt-1 px-3 py-2 border rounded-md">
                    {(Object.values(LeaveType )as string[]).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium">Reason</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} required rows={3} className="w-full mt-1 px-3 py-2 border rounded-md"></textarea>
            </div>

            <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition-colors">
                Submit Request
            </button>
        </form>
    );
}

const LeaveHistory = ({ history, isLoading }: { history: LeaveRequest[], isLoading: boolean }) => {
    if (isLoading) return <p>Loading leave history...</p>;
    
    return (
        <div className="mt-8">
            <h3 className="text-2xl font-semibold mb-4">My Leave History</h3>
            
            {history.length === 0 ? (
                <p>You have no past leave requests.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applied On</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {history.map((req) => (
                                <tr key={req.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{moment(req.startDate).format('MMM D')} - {moment(req.endDate).format('MMM D, YYYY')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{req.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(req.appliedOn).format('MMM D, HH:mm')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const MyLeavesContent = () => {
    const [history, setHistory] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            // Backend endpoint: /api/leaves/my-leaves
            const response = await apiClient.get<LeaveRequest[]>('/leaves/my-leaves');
            setHistory(response.data.reverse()); // Most recent first
        } catch (err) {
            console.error('Failed to fetch leave history:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Leaves</h1>
            
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <ApplyLeaveForm onLeaveSubmitted={fetchHistory} />
                </div>
                <div className="md:col-span-2">
                    <LeaveHistory history={history} isLoading={loading} />
                </div>
            </div>
        </div>
    );
}

export default function MyLeavesPage() {
    return (
        <ProtectedRoute requiredRole='EMPLOYEE'>
            <MyLeavesContent />
        </ProtectedRoute>
    );
}