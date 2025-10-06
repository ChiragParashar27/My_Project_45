// src/data/navigation.ts
import { Role } from '@/types/auth';

interface NavItem {
    name: string;
    href: string;
    requiredRole: Role;
}

export const navigation: NavItem[] = [
    // Employee & All Roles
    { name: 'Dashboard', href: '/dashboard', requiredRole: 'EMPLOYEE' },
    { name: 'My Profile', href: '/profile', requiredRole: 'EMPLOYEE' },
    { name: 'Attendance', href: '/attendance/my-history', requiredRole: 'EMPLOYEE' },
    { name: 'Leaves', href: '/leaves/my-requests', requiredRole: 'EMPLOYEE' },
    { name: 'Payroll', href: '/payroll/my-payrolls', requiredRole: 'EMPLOYEE' },
    { name: 'Global Chat', href: '/chat', requiredRole: 'EMPLOYEE' },

    // Manager & Admin Roles
    { name: 'Leave Review', href: '/leaves/review', requiredRole: 'MANAGER' },

    // Admin Only Roles
    { name: 'User Management', href: '/admin/users', requiredRole: 'ADMIN' },
    { name: 'Payroll Admin', href: '/admin/payroll', requiredRole: 'ADMIN' },
];