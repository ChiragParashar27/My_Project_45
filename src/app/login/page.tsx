// src/app/login/page.tsx - FINAL, CORRECTED VERSION

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore'; 
import { AuthResponse, User } from '@/types/auth'; // Ensure User is imported
import axios from 'axios'; 
import { useShallow } from 'zustand/react/shallow'; // Needed for correct selector comparison

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const { setAuth, logout, token } = useAuthStore(
        useShallow((state) => ({ 
            setAuth: state.setAuth, 
            logout: state.logout,
            token: state.token 
        }))
    );
    
    // 1. Session Guard (Prevents authenticated users from seeing the login page)
    useEffect(() => {
        if (token) {
            router.replace('/dashboard');
        }
    }, [token, router]);


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');

        try {
            // 2. Clear old session data first
            logout(); 
            
            // 3. Post credentials and receive token
            const loginResponse = await apiClient.post<AuthResponse>('/auth/login', { username, password });
            
            const newToken = loginResponse.data.token;
            const mustReset = loginResponse.data.mustResetPassword;

            // 4. FETCH USER DETAILS: Pass the fresh token explicitly for the first authenticated call
            const userResponse = await apiClient.get<User>('/employee/me', {
                headers: {
                    Authorization: `Bearer ${newToken}`
                }
            }); 
            
            // 5. Set global state (This triggers the useEffect guard above to redirect)
            setAuth(newToken, userResponse.data);

            // 6. Handle specific redirects (though useEffect handles the default /dashboard redirect)
            if (mustReset) {
                router.push('/first-login');
            }
            // Note: If !mustReset, the useEffect hook will handle the redirect to /dashboard.

        } catch (err) {
            let message = 'Login failed. Check your credentials.';
            
            if (axios.isAxiosError(err)) {
                const backendMessage = err.response?.data;
                if (typeof backendMessage === 'string') {
                    message = backendMessage;
                } else if (backendMessage && typeof backendMessage.message === 'string') {
                    message = backendMessage.message;
                }
            }
            
            setError(message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            {/* Render login form ONLY if not authenticated */}
            {!token && (
                <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-md w-96">
                    <h2 className="text-2xl font-bold mb-6 text-center">EMS Login</h2>
                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    <div className="mb-4">
                        <label className="block text-gray-700">Username (Email)</label>
                        <input
                            type="email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
                        Sign In
                    </button>

                    <p className="mt-4 text-center text-sm">
                        <a href="/register" className="text-indigo-600 hover:underline">Register</a> | 
                        <a href="/forgot-password" className="text-indigo-600 hover:underline ml-2">Forgot Password?</a>
                    </p>
                </form>
            )}
            
            {/* Show a message while redirecting */}
            {token && <div className="text-xl">Redirecting to Dashboard...</div>}
        </div>
    );
}