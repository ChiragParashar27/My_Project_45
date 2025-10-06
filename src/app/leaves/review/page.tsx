// src/app/leaves/review/page.tsx - Leave Review (ADMIN, MANAGER Only)
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LeaveRequest, LeaveStatus } from '@/types/leave'; // Assuming interfaces are here
import moment from 'moment';

const LeaveReviewContent = () => {
    const [requests, setRequests] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [filter, setFilter] = useState<LeaveStatus | 'ALL'>('PENDING');

    // NOTE: Employee names lookup would be complex. For simplicity, we show Employee ID (employeeId)
    // which is present in the LeaveRequest object as retrieved from the backend.

    const fetchRequests = async () => {
        try {
            setLoading(true);
            // Endpoint: GET /api/leaves/all - accessible by ADMIN/MANAGER
            const response = await apiClient.get<LeaveRequest[]>('/leaves/all');
            
            // The LeaveRequest object retrieved from the API has an employeeId field (as per the entity).
            setRequests(response.data);
        } catch (err) {
            console.error('Failed to fetch leave requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (leaveId: number, action: 'approve' | 'reject') => {
        if (!confirm(`Confirm to ${action} leave request ${leaveId}?`)) return;
        setMessage(null);
        try {
            // Endpoint: POST /api/leaves/approve/{leaveId} or /reject/{leaveId}
            const response = await apiClient.post(`/leaves/${action}/${leaveId}`);
            setMessage(response.data);
            fetchRequests(); // Refresh the list
        } catch (err: any) {
            setMessage(err.response?.data || `Failed to ${action} leave.`);
        }
    };

    const filteredRequests = requests.filter(req => filter === 'ALL' || req.status === filter)
        .sort((a, b) => moment(a.appliedOn).isBefore(moment(b.appliedOn)) ? 1 : -1);

    if (loading) return <div>Loading leave requests...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Leave Review Center</h1>

            <div className="flex justify-between items-center mb-4">
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value as LeaveStatus | 'ALL')}
                    className="p-2 border rounded-md"
                >
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                    <option value="ALL">All Requests</option>
                </select>
                {message && <p className="text-sm text-green-600 font-medium">{message}</p>}
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredRequests.map((req) => (
                            <tr key={req.id}>
                                {/* Assuming the LeaveRequest object contains employeeId */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{(req as any).employeeId}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{moment(req.startDate).format('MMM D')} - {moment(req.endDate).format('MMM D, YYYY')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{req.type}</td>
                                <td className="px-6 py-4 text-sm max-w-xs truncate">{req.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        req.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                    {req.status === 'PENDING' ? (
                                        <>
                                            <button onClick={() => handleAction(req.id, 'approve')} className="text-green-600 hover:text-green-900 border border-green-600 px-2 py-1 rounded text-xs">
                                                Approve
                                            </button>
                                            <button onClick={() => handleAction(req.id, 'reject')} className="text-red-600 hover:text-red-900 border border-red-600 px-2 py-1 rounded text-xs">
                                                Reject
                                            </button>
                                        </>
                                    ) : (
                                        <span className='text-gray-400'>No Action</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function LeaveReviewPage() {
    return (
        // ProtectedRoute will allow both ADMIN and MANAGER roles access
        <ProtectedRoute requiredRole='MANAGER'> 
            <LeaveReviewContent />
        </ProtectedRoute>
    );
}