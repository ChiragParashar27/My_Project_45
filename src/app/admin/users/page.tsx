// src/app/admin/users/page.tsx - User Management (ADMIN Only)
'use client';

import { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { User, Role } from '@/types/auth'; // Assuming Role is imported from here
import moment from 'moment';

// --- ASSUMED INTERFACES ---
// Extend the base User interface for admin view
interface UserAdmin extends User {
    dateOfJoining: string | null;
    approved: boolean;
    active: boolean;
    // Include all base User fields defined in src/types/auth.ts
    contactNumber: string;
    department: string;
    designation: string;
}
// DTO for user creation/update (password is optional for update)
interface UserRegistrationDto {
    name: string;
    username: string;
    password?: string; 
    contactNumber: string;
    department: string;
    designation: string;
    dateOfJoining?: string;
    role: Role;
}
// --- END ASSUMED INTERFACES ---

const UserManagementContent = () => {
    const [users, setUsers] = useState<UserAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Modal state (Modal component omitted for brevity, but the trigger functions are here)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentEditUser, setCurrentEditUser] = useState<UserAdmin | null>(null);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Endpoint: GET /api/users/all
            const response = await apiClient.get<UserAdmin[]>('/users/all');
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data || 'Failed to fetch users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId: number) => {
        if (!confirm('Are you sure you want to approve this user?')) return;
        setMessage(null);
        try {
            // Endpoint: POST /api/users/approve/{userId}
            const response = await apiClient.post(`/users/approve/${userId}`);
            setMessage(response.data);
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data || 'Approval failed.');
        }
    };
    
    const handleDelete = async (userId: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        setMessage(null);
        try {
            // Endpoint: DELETE /api/users/delete/{id}
            const response = await apiClient.delete(`/users/delete/${userId}`);
            setMessage(response.data);
            fetchUsers();
        } catch (err: any) {
            setError(err.response?.data || 'Deletion failed.');
        }
    };
    
    // Function to open the modal for creation
    const openCreateModal = () => {
        setModalMode('create');
        setCurrentEditUser(null);
        setIsModalOpen(true);
    };

    if (loading) return <div>Loading user data...</div>;
    if (error) return <div className="text-red-500">Error: {error}</div>;

    return (
        <div className="max-w-full mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">User Management</h1>
            <div className="flex justify-between mb-4">
                {message && <p className="text-green-600 font-medium">{message}</p>}
                <button 
                    onClick={openCreateModal}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                    Add New User
                </button>
            </div>

            {/* UserModal Component would be rendered here */}
            {isModalOpen && <div className="p-4 bg-yellow-100">User Modal Placeholder (Create/Edit)</div>}

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name (Email)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{user.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.name} ({user.username})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{user.role}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {user.approved ? 'Approved' : 'Pending'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {user.dateOfJoining ? moment(user.dateOfJoining).format('MMM D, YYYY') : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {!user.approved && (
                                        <button 
                                            onClick={() => handleApprove(user.id)}
                                            className="text-green-600 hover:text-green-900 border border-green-600 px-2 py-1 rounded text-xs"
                                        >
                                            Approve
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setCurrentEditUser(user);
                                            setModalMode('edit');
                                            setIsModalOpen(true);
                                        }}
                                        className="text-indigo-600 hover:text-indigo-900 border border-indigo-600 px-2 py-1 rounded text-xs"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(user.id)}
                                        className="text-red-600 hover:text-red-900 border border-red-600 px-2 py-1 rounded text-xs"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default function AdminUsersPage() {
    return (
        <ProtectedRoute requiredRole='ADMIN'>
            <UserManagementContent />
        </ProtectedRoute>
    );
}