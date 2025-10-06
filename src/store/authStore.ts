// src/store/authStore.ts
import { create } from 'zustand';
import { AuthState, User, Role } from '@/types/auth';

// Function to safely decode JWT to get the user's role
const decodeRoleFromToken = (token: string): Role | null => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // The backend JWT includes the full role string, e.g., "ROLE_ADMIN"
    const roleString = payload.role as string; 
    return roleString.replace('ROLE_', '') as Role; 
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  role: null,
  isAuthenticated: false,

  setAuth: (token: string, user: User) => { 
    const role = decodeRoleFromToken(token);
    if (!role) {
      console.error("Token decode failed. Cannot set auth state.");
      return;
    }
    set({
      token,
      user,
      role, // The role is set internally
      isAuthenticated: true,
    });
    localStorage.setItem('jwtToken', token);
  },

  logout: () => {
    set({ token: null, user: null, role: null, isAuthenticated: false });
    localStorage.removeItem('jwtToken');
  },
}));