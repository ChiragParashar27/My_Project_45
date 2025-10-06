// src/app/register/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    username: '', // email
    password: '',
    contactNumber: '',
    department: '',
    designation: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      // The backend /auth/register endpoint expects a 'User' entity structure for self-registration 
      // where Role, Approved status are set by the controller.
      await apiClient.post('/auth/register', formData);
      
      setMessage("Registration successful! Your account is pending admin approval. You will be notified via email.");
      setTimeout(() => router.push('/login'), 5000);

    } catch (err: any) {
      const errorMessage = err.response?.data || 'Registration failed. Please check your input.';
      setError(errorMessage);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="p-8 bg-white rounded shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Employee Registration</h2>
        {message && <p className="text-green-600 mb-4 font-medium">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-4">
            {Object.keys(formData).map((key) => (
                <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1')}
                    </label>
                    <input
                        type={key === 'password' ? 'password' : (key === 'username' ? 'email' : 'text')}
                        name={key}
                        value={(formData as any)[key]}
                        onChange={handleChange}
                        className="w-full mt-1 px-3 py-2 border rounded-md"
                        required
                    />
                </div>
            ))}
        </div>

        <button type="submit" className="w-full mt-6 bg-green-600 text-white py-2 rounded-md hover:bg-green-700">
          Register Account
        </button>

        <p className="mt-4 text-center text-sm">
          Already have an account? <a href="/login" className="text-indigo-600 hover:underline">Sign In</a>
        </p>
      </form>
    </div>
  );
}