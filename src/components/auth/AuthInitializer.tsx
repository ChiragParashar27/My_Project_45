// src/components/auth/AuthInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import apiClient from '@/lib/axios';

// Component responsible for checking localStorage for a token 
// and validating it on application load.
export const AuthInitializer = () => {
  const { setAuth, logout, isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only run on the client side and if not already authenticated
    if (!isAuthenticated) {
      const storedToken = localStorage.getItem('jwtToken');
      
      if (storedToken) {
        // Step 1: Attempt to use stored token to fetch user details
        const fetchUserAndSetAuth = async () => {
          try {
            // Temporarily set Authorization header for this request only
            const config = { headers: { Authorization: `Bearer ${storedToken}` } };
            
            // This validates the token and retrieves user data in one step
            const userResponse = await apiClient.get('/employee/me', config);
            
            setAuth(storedToken, userResponse.data);
            
          } catch (e) {
            // Token is expired, invalid, or user fetch failed
            console.error("Token invalid or user data fetch failed, logging out.");
            logout();
          }
        };
        fetchUserAndSetAuth();
      }
    }
    // Note: Dependencies are intentionally limited to prevent infinite loops
    // This hook should run once on mount.
  }, []); 

  return null; // This component is only for logic, not rendering
};