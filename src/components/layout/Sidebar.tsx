// src/components/layout/Sidebar.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { navigation } from '@/data/navigation';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import apiClient from '@/lib/axios';

export const Sidebar = () => {
  const { user, role, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  if (!user || !role) return null; // Only show sidebar if authenticated

  const isAuthorized = (requiredRole: string) => {
    if (role === 'ADMIN') return true;
    if (requiredRole === 'EMPLOYEE') return true; // All roles are employees
    return role === requiredRole;
  };

  const handleLogout = async () => {
    try {
      // Trigger backend check-out logic
      await apiClient.post('/auth/logout', {}); 
    } catch (e) {
      console.error("Logout check-out failed, proceeding with client logout.");
    } finally {
      logout();
      router.push('/login');
    }
  };

  return (
    <div className="flex h-screen flex-col justify-between border-r bg-white p-4 w-64">
      <div className="space-y-6">
        <div className="text-2xl font-bold text-indigo-600">EMS Portal</div>
        <div className="border-t pt-4">
          <p className="text-lg font-semibold">{user.name}</p>
          <p className="text-sm text-gray-500">{role}</p>
        </div>
        <nav className="flex flex-col space-y-2">
          {navigation.filter(item => isAuthorized(item.requiredRole)).map((item) => (
            <Link 
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 rounded-lg transition-colors 
                ${pathname === item.href 
                  ? 'bg-indigo-500 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>
      <button 
        onClick={handleLogout}
        className="text-red-500 hover:bg-red-50 border border-red-500 py-2 rounded-lg transition-colors"
      >
        Logout
      </button>
    </div>
  );
};