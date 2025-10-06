// src/app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';
import { useRouter } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // Backend expects the username (email) as the request body.
      const response = await apiClient.post('/auth/forgot-password', username, {
        headers: { 'Content-Type': 'text/plain' },
      });
      
      // The backend returns a generic success message for security.
      setMessage(response.data);
      
    } catch (err: any) {
      // In case of a server-side failure like email service error
      const errorMessage = err.response?.data || 'An error occurred while requesting reset.';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Forgot Password</h2>
        <p className="mb-4 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
        </p>

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-gray-700">Email Address</label>
            <input
              type="email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              required
            />
          </div>

          <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700">
            Send Reset Link
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <a href="/login" className="text-indigo-600 hover:underline">Back to Login</a>
        </p>
      </div>
    </div>
  );
}