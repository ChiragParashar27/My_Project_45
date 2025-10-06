// src/components/auth/ProtectedRoute.tsx
'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, role, token } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // 1. Check for stored token on initial load (hydration)
    if (!isAuthenticated && !token && typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken) {
            // Need a logic to fetch user details and validate token on startup
            // For now, we only check for token existence on initial load
            // A dedicated startup hook would handle full token/user validation
        }
    }

    // 2. Enforce Authentication
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // 3. Enforce Authorization (Role Check)
    if (requiredRole && role && requiredRole !== role) {
      // Basic role check:
      // ADMIN should be able to access all, but we'll keep it simple for now:
      // Only grant access if the current role matches the required role, 
      // or if the required role is covered by the current role (e.g., ADMIN can do anything)
      
      const isAuthorized = role === requiredRole || (requiredRole !== 'ADMIN' && role === 'ADMIN');
      
      if (!isAuthorized) {
        router.replace('/403'); // Redirect to Access Denied page
      }
    }
  }, [isAuthenticated, role, requiredRole, router, token]);

  if (!isAuthenticated || (requiredRole && role !== requiredRole && role !== 'ADMIN')) {
    return <div>Loading... or Redirecting...</div>;
  }

  return <>{children}</>;
};