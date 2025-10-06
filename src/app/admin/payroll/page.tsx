// src/app/admin/payroll/page.tsx - FINAL, PRODUCTION-READY VERSION

'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import apiClient from '@/lib/axios';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import moment from 'moment';
import axios from 'axios';

// --- INTERFACE DEFINITIONS ---
interface Payroll {
    id: number;
    employeeId: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    netSalary: number;
    salaryMonth: string;
}

interface EmployeeMap {
    id: number;
    name: string;
}

interface PayrollCreationDto {
    employeeId: number;
    basicSalary: number;
    allowances: number;
    deductions: number;
    salaryMonth: string;
}
// --- END INTERFACE DEFINITIONS ---

const initialFormData: PayrollCreationDto = {
    employeeId: 0,
    basicSalary: 0,
    allowances: 0,
    deductions: 0,
    salaryMonth: moment().startOf('month').format('YYYY-MM-DD'), 
};

const PayrollAdminContent = () => {
    const [payrolls, setPayrolls] = useState<Payroll[]>([]);
    const [employees, setEmployees] = useState<EmployeeMap[]>([]);
    const [employeeMap, setEmployeeMap] = useState<Record<number, string>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState<PayrollCreationDto>(initialFormData);
    const [modalError, setModalError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

    // Helper function to update form state
    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'salaryMonth' ? value : Number(value)
        }));
    };

    const fetchEmployeeData = async () => {
        try {
            const response = await apiClient.get<EmployeeMap[]>('/users/all');
            const userList = response.data.map(user => ({ id: user.id, name: user.name }));
            
            setEmployees(userList); 

            const map = userList.reduce((acc, user) => {
                acc[user.id] = user.name;
                return acc;
            }, {} as Record<number, string>);
            setEmployeeMap(map);
        } catch (err) {
            console.error('Failed to fetch employee list for payroll display:', err);
        }
    };


    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            const payrollResponse = await apiClient.get<Payroll[]>('/payroll/all');
            setPayrolls(payrollResponse.data.sort((a, b) => moment(b.salaryMonth).valueOf() - moment(a.salaryMonth).valueOf()));
        } catch (err) {
            console.error('Failed to fetch payrolls:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployeeData();
        fetchPayrolls();
    }, []);

    // Secure PDF download logic
    const handleDownloadSlip = async (payrollId: number) => {
        try {
            const response = await apiClient.get(`/payroll/slip/${payrollId}`, { responseType: 'blob' });
            const file = new Blob([response.data], { type: 'application/pdf' });
            const fileURL = URL.createObjectURL(file);
            const link = document.createElement('a');
            
            link.href = fileURL;
            link.setAttribute('download', `salary-slip-${payrollId}-${moment().format('YYYYMMDD')}.pdf`);
            document.body.appendChild(link);
            
            link.click();
            link.remove();
            URL.revokeObjectURL(fileURL);
            setMessage(`Slip for Payroll ID ${payrollId} downloaded successfully.`);

        } catch (error) {
            console.error("Failed to download salary slip:", error);
            alert("Error downloading slip. Authentication may have expired.");
        }
    };
    
    const handleManualCreate = () => {
        setFormData(initialFormData);
        setShowModal(true);
        setMessage(null);
        setModalError(null); // Clear errors when opening modal
        setFieldErrors({});
    };

    // Submits the manual payroll form
    const handleManualSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setModalError(null); 
        setFieldErrors({});

        // --- 🎯 FIX 1: CLIENT-SIDE VALIDATION (Field Specific) ---
        let errors: { [key: string]: string } = {};
        const totalEarnings = formData.basicSalary + formData.allowances;
        
        if (formData.employeeId === 0) {
            errors.employeeId = "Please select an employee.";
        }
        if (formData.basicSalary <= 0) {
            errors.basicSalary = "Basic Salary must be greater than 0.";
        }
        if (formData.deductions < 0) {
            errors.deductions = "Deductions cannot be negative.";
        }
        
        // This validation MUST match the PayrollService logic
        if (formData.deductions > totalEarnings) {
            errors.deductions = `Exceeds total earnings ($${totalEarnings.toFixed(2)}).`;
            setModalError("Validation Failed: Deductions cannot exceed total earnings.");
            setFieldErrors(errors);
            setIsSubmitting(false);
            return;
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            setIsSubmitting(false);
            setModalError("Please correct the highlighted fields.");
            return;
        }
        // --- END CLIENT-SIDE VALIDATION ---

        try {
            const response = await apiClient.post<Payroll>('/payroll/create', formData);
            
            // Success logic
            setPayrolls(prev => [response.data, ...prev].sort((a, b) => moment(b.salaryMonth).valueOf() - moment(a.salaryMonth).valueOf()));
            
            const employeeName = employeeMap[response.data.employeeId] || `ID ${response.data.employeeId}`;
            setMessage(`Payroll successfully created for ${employeeName} for ${moment(response.data.salaryMonth).format('MMM YYYY')}.`);
            
            setShowModal(false);
            setFormData(initialFormData);

        } catch (err: any) {
            // 🎯 FIX 2: Capture Backend 403/400 errors
            let msg = "Failed to create payroll. Check input fields.";
            
            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                const responseData = err.response.data;
                const backendError = typeof responseData === 'string' ? responseData : (responseData?.message || 'Unknown server error.');

                if (status === 403) {
                    msg = "Permission Denied (403). Your session may be expired. Please log out and back in.";
                } else if (status === 400) {
                    // Backend Validation Errors (Employee ID not found, Deductions cap, etc.)
                    msg = `Validation Error: ${backendError}`;
                } else {
                    msg = `API Error ${status}: ${backendError}`;
                }
            }
            
            // Display error in the MODAL, and close modal only on 403 (forcing main page redirect)
            setModalError(msg);
            
            if (msg.includes("403")) {
                 setMessage(`Error: ${msg}`);
                 setShowModal(false);
            }
            console.error('Manual payroll submission failed:', err); 

        } finally {
             setIsSubmitting(false);
        }
    };

    if (loading) return <div>Loading payroll records and employee data...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Payroll Administration</h1>
            
            {/* Display message (Top Page Toast Area) */}
            <div className="flex justify-between items-center mb-4">
                {message && (
                    <p className={`text-sm font-medium ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
                        {message}
                    </p>
                )}
                <button 
                    onClick={handleManualCreate}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                    Create Payroll (Manual)
                </button>
            </div>
            
            {/* Payroll Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee Name</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payrolls.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No payroll records found.</td>
                            </tr>
                        ) : (
                            payrolls.map((payroll) => (
                                <tr key={payroll.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{moment(payroll.salaryMonth).format('MMM YYYY')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {employeeMap[payroll.employeeId] || `ID: ${payroll.employeeId} (Not Found)`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">${payroll.basicSalary.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-right text-indigo-700">${payroll.netSalary.toFixed(2)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                                        <button 
                                            onClick={() => handleDownloadSlip(payroll.id)}
                                            className="text-blue-600 hover:text-blue-900 border border-blue-600 px-2 py-1 rounded text-xs"
                                        >
                                            Download Slip
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Manual Payroll Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex justify-center items-center">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-6">Create Manual Payroll</h2>
                        
                        {/* 🎯 FIX 3: Display general modal error/validation summary */}
                        {modalError && (
                            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm font-medium">
                                {modalError}
                            </div>
                        )}

                        <form onSubmit={handleManualSubmit}>
                            
                            {/* Employee Dropdown Selector */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="employeeId">Employee Name</label>
                                <select
                                    id="employeeId"
                                    name="employeeId"
                                    value={formData.employeeId || ''}
                                    onChange={handleFormChange}
                                    required
                                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${fieldErrors.employeeId ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="" disabled>Select Employee</option>
                                    {employees.map(emp => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name} (ID: {emp.id})
                                        </option>
                                    ))}
                                </select>
                                {fieldErrors.employeeId && <p className="text-red-500 text-xs mt-1">{fieldErrors.employeeId}</p>}
                            </div>
                            {/* End Dropdown Selector */}

                            {/* Salary Month */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Salary Month (First Day)</label>
                                <input
                                    type="date"
                                    name="salaryMonth"
                                    value={formData.salaryMonth}
                                    onChange={handleFormChange}
                                    required
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                />
                            </div>

                            {/* Basic Salary */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Basic Salary ($)</label>
                                <input
                                    type="number"
                                    name="basicSalary"
                                    value={formData.basicSalary || ''}
                                    onChange={handleFormChange}
                                    required
                                    min="1"
                                    step="0.01"
                                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${fieldErrors.basicSalary ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {fieldErrors.basicSalary && <p className="text-red-500 text-xs mt-1">{fieldErrors.basicSalary}</p>}
                            </div>
                            
                            {/* Allowances */}
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Allowances ($)</label>
                                <input
                                    type="number"
                                    name="allowances"
                                    value={formData.allowances || ''}
                                    onChange={handleFormChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                                />
                            </div>
                            
                            {/* Deductions */}
                            <div className="mb-6">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Deductions ($)</label>
                                <input
                                    type="number"
                                    name="deductions"
                                    value={formData.deductions || ''}
                                    onChange={handleFormChange}
                                    required
                                    min="0"
                                    step="0.01"
                                    // Highlight if it's the specific deduction error field
                                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${fieldErrors.deductions ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {fieldErrors.deductions && <p className="text-red-500 text-xs mt-1 font-semibold">{fieldErrors.deductions}</p>}
                            </div>

                            <div className="flex justify-end space-x-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
                                    disabled={isSubmitting || employees.length === 0}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create Payroll'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function AdminPayrollPage() {
    return (
        <ProtectedRoute requiredRole='ADMIN'>
            <PayrollAdminContent />
        </ProtectedRoute>
    );
}