// src/app/payroll/my-payrolls/page.tsx - FINAL VERSION WITH SECURE DOWNLOAD FIX

'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import moment from 'moment';
import axios from 'axios'; // Required for secure Blob handling and error check

// --- INTERFACE DEFINITIONS ---
interface Payroll {
    id: number;
    employeeId: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    salaryMonth: string; // LocalDate
}
// --- END INTERFACE DEFINITIONS ---

const MyPayrollsContent = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [loading, setLoading] = useState(true);
    // Use state to display messages (like a toast/alert)
    const [message, setMessage] = useState<string | null>(null); 

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get<Payroll[]>('/payroll/my-salary');
            setPayrolls(response.data.sort((a, b) => moment(b.salaryMonth).valueOf() - moment(a.salaryMonth).valueOf()));
        } catch (err) {
            console.error('Failed to fetch payroll history:', err);
            // 🎯 Display error to the user
            setMessage("Error: Failed to load payroll history. Please check your connection.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayrolls();
    }, []);

    // 🎯 FIX: SECURE PDF DOWNLOAD USING AXIOS AND BLOB
    const handleDownloadSlip = async (payrollId: number) => {
        setMessage(null); // Clear previous messages
        try {
            // 1. Use apiClient (sends the JWT) to fetch the PDF as a binary Blob
            const response = await apiClient.get(`/payroll/slip/${payrollId}`, {
                responseType: 'blob', // IMPORTANT: Treats the response as binary data
            });

            // 2. Create a temporary URL and trigger download (Standard Blob method)
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            
            link.href = fileURL;
            link.setAttribute('download', `salary-slip-${payrollId}-${moment().format('YYYYMMDD')}.pdf`);
            document.body.appendChild(link);
            
            link.click();
            link.remove();
            URL.revokeObjectURL(fileURL);
            
            // 3. Display success message
            setMessage(`Success: Salary slip for ${moment(payrolls.find(p => p.id === payrollId)?.salaryMonth).format('MMM YYYY')} downloaded.`);

        } catch (error) {
            // 🎯 FIX: Robust Error Handling for 403/400
            let msg = "Failed to download slip. Check the console for details.";

            if (axios.isAxiosError(error) && error.response) {
                const status = error.response.status;

                if (status === 403 || status === 401) {
                    msg = "Error: Authentication expired. Please log in again to download the slip.";
                } else if (status === 404) {
                    msg = "Error: Slip not found for this payroll ID.";
                }
            }
            
            // Display error message at the top of the page
            setMessage(msg);
            console.error("Failed to download salary slip:", error);
        }
    };

    if (loading) return <div>Loading payroll history...</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">My Payroll History</h1>
            
            {message && (
                // Display the message clearly at the top
                <div className={`mb-4 p-3 rounded text-sm ${message.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            {payrolls.length === 0 ? (
                <p>No payroll records found for you yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slip</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {payrolls.map((payroll) => (
                                <tr key={payroll.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{moment(payroll.salaryMonth).format('MMM YYYY')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${payroll.basicSalary.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">${payroll.deductions.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-indigo-700">${payroll.netSalary.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <button 
                                            onClick={() => handleDownloadSlip(payroll.id)}
                                            className="text-blue-600 hover:text-blue-800 border border-blue-600 px-2 py-1 rounded text-xs"
                                        >
                                            Download
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default function MyPayrollsPage() {
    return (
        <ProtectedRoute requiredRole='EMPLOYEE'>
            <MyPayrollsContent />
        </ProtectedRoute>
    );
}