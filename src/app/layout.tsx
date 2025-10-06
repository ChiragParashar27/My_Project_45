// src/app/layout.tsx - FINAL VERSION WITH AUTO-CHECKOUT BEACON & INFINITE LOOP FIX

'use client'; 

import './globals.css';
import React, { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { useShallow } from 'zustand/react/shallow'; 

const API_BASE_URL = 'http://localhost:8080/api'; 

const setupAutoCheckout = (token: string | null) => {
    if (!token || typeof navigator.sendBeacon === 'undefined') return;

    const url = `${API_BASE_URL}/attendance/auto-checkout`; 

    const handleBeforeUnload = () => {
        const payload = new Blob([JSON.stringify({ reason: "browser_close" })], { type: 'application/json' });
        
        // Use sendBeacon for reliable, non-blocking delivery
        navigator.sendBeacon(url, payload); 
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 🎯 FIX: Use useShallow to prevent the infinite loop warning
    const { isAuthenticated, token } = useAuthStore(
        useShallow((state) => ({ 
            isAuthenticated: state.isAuthenticated,
            token: state.token
        }))
    );

    // Register the auto-checkout logic when the component mounts and when the token changes
    useEffect(() => {
        const cleanup = setupAutoCheckout(token); 
        return cleanup;
    }, [token]);


    return (
        <html lang="en">
            <body>
                <AuthInitializer />
                
                {isAuthenticated ? (
                    <div className="flex min-h-screen">
                        <Sidebar />
                        <main className="flex-1 p-8 overflow-y-auto">
                            {children}
                        </main>
                    </div>
                ) : (
                    <div>{children}</div>
                )}
            </body>
        </html>
    );
}