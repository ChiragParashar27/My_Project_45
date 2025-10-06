// src/types/auth.ts
export type Role = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: number;
  name: string;
  username: string; // Email
  role: Role;
  contactNumber: string;
    department: string;
    designation: string;
    dateOfJoining?: string; // LocalDate
    approved?: boolean;
    firstLogin?: boolean;
    active?: boolean;
    profilePictureUrl?: string;
    emergencyContactName?: string;
    emergencyContactNumber?: string;
  // Add other necessary profile fields
}

export interface AuthResponse {
  token: string;
  mustResetPassword: boolean;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  
  // FIX: Change definition to expect only the token and the fetched User object
  setAuth: (token: string, user: User) => void; 
  
  logout: () => void;
}