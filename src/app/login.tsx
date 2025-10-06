// src/app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { AuthResponse } from '@/types/auth';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', { username, password });
      
      const token = response.data.token;
      const mustReset = response.data.mustResetPassword; // Check if firstLogin is true

      // We need to fetch the user object after login to get the actual user details and role
      const userResponse = await apiClient.get('/employee/me'); // Using the /me endpoint
      
      setAuth(token, userResponse.data);

      if (mustReset) {
        router.push('/first-login');
      } else {
        router.push('/dashboard');
      }

    } catch (err: any) {
      const message = err.response?.data || 'Login failed. Check your credentials.';
      setError(message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
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
    </div>
  );
}