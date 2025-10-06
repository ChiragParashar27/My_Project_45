// Frontend: app/first-login/page.tsx

"use client";

import React, { useState, FormEvent } from 'react'; // 👈 Import FormEvent
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios'; // 👈 Import AxiosError

// NOTE: Ensure your axios instance is configured to use the correct baseURL
const API_BASE_URL = "http://localhost:8080"; 

const FirstLoginPage = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<{ message: string, type: string }>({ message: '', type: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // 👈 Added FormEvent type annotation
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => { 
        e.preventDefault();
        setStatus({ message: '', type: '' });
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setStatus({ message: "Passwords do not match.", type: 'error' });
            setLoading(false);
            return;
        }

        // 1. Get Authentication Token
        const token = localStorage.getItem('accessToken'); 
        if (!token) {
            setStatus({ message: "Session expired. Please log in again.", type: 'error' });
            setLoading(false);
            router.push('/login');
            return;
        }

        try {
            // 2. Call the backend's secure password change endpoint
            await axios.post(
                `${API_BASE_URL}/api/employee/change-password`,
                { newPassword: newPassword },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            setStatus({ message: "Password successfully changed! Redirecting to dashboard...", type: 'success' });
            
            // 3. Clear firstLogin flag in local storage state if you use one.
            localStorage.removeItem('mustResetPassword'); 

            // 4. Redirect the user to the main dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 2000);

        } catch (err) {
            // 👈 Implemented type guard for AxiosError
            if (axios.isAxiosError(err)) {
                // Safely access properties on an AxiosError
                const errorData = err.response?.data;
                const errorMessage = typeof errorData === 'string' 
                    ? errorData 
                    : "Failed to update password. Check complexity rules.";

                setStatus({ message: errorMessage, type: 'error' });
            } else {
                // Handle non-Axios or unknown errors
                console.error("Unknown error:", err);
                setStatus({ message: "An unexpected error occurred.", type: 'error' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white shadow-md rounded-lg w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center text-red-600">
                    Mandatory Password Change
                </h2>
                <p className="mb-4 text-sm text-gray-600">
                    This is your first login. Please set a new, secure password to continue.
                </p>
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="new-password">
                            New Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <input
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    
                    {/* Display Status Messages */}
                    {status.message && (
                        <p className={`text-sm italic mb-4 ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                            {status.message}
                        </p>
                    )}

                    <div className="flex items-center justify-between">
                        <button
                            className={`bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Updating...' : 'Change Password & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FirstLoginPage;