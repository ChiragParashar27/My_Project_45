// src/app/profile/page.tsx - REWRITTEN TO READ DYNAMIC DATA

"use client";

import React, { useState, useEffect } from "react";
// 1. Import necessary hook and store
import { useAuthStore } from '@/store/authStore'; 
import apiClient from '@/lib/axios';
import { User } from '@/types/auth'; // Assuming you have a User interface

export default function ProfilePage() {
    // 2. Read the current user's profile from the global state
    const { user, token } = useAuthStore();
    const [profile, setProfile] = useState<User | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    
    // We only need local state for form changes, the initial state should be from the store.
    useEffect(() => {
        if (user) {
            // Use the data from the store as the initial form state
            setProfile(user);
            setLoading(false);
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!profile) return;
        setProfile({ ...profile, [e.target.name]: e.target.value } as User); // Type assertion needed here
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile || !token) return;

        try {
            // 🎯 API Call to update profile data (text fields)
            const updateResponse = await apiClient.put('/employee/update', profile, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // 🎯 Handle Photo Upload (separate request)
            if (photoFile) {
                const formData = new FormData();
                formData.append('file', photoFile);

                await apiClient.post('/employee/upload-photo', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: `Bearer ${token}`
                    }
                });
            }
            console.log("Profile successfully updated.");
            // Ideally, update the global store here as well: useAuthStore.getState().setUser(updateResponse.data);

        } catch (error) {
            console.error("Profile update failed:", error);
        }
    };

    if (loading || !profile) return <div className="p-6">Loading Admin Profile...</div>;

    // Use a dynamic URL, pointing to the backend's /uploads handler
    const profilePicUrl = photoFile
        ? URL.createObjectURL(photoFile)
        : profile.profilePictureUrl
        ? `http://localhost:8080/${profile.profilePictureUrl}` // Use dynamic backend URL
        : "/default-avatar.png"; 

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">My Profile</h1>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Profile Sidebar */}
                <div className="bg-white shadow rounded-xl p-6 flex flex-col items-center">
                    <img
                        src={profilePicUrl}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-indigo-500"
                    />
                    <h2 className="mt-4 text-xl font-semibold">{profile.name}</h2>
                    <p className="text-gray-500">{profile.designation}</p>
                    <label className="mt-4 text-indigo-600 cursor-pointer hover:underline">
                        Choose Photo
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                    </label>
                </div>

                {/* Profile Form */}
                <form
                    onSubmit={handleSubmit}
                    className="md:col-span-2 bg-white shadow rounded-xl p-6"
                >
                    <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Ensure all inputs use dynamic profile data */}
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium">Name</label>
                            <input name="name" value={profile.name} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                        {/* Username (Email) */}
                        <div>
                            <label className="block text-sm font-medium">Username</label>
                            <input name="username" value={profile.username} disabled className="mt-1 w-full border rounded-lg px-3 py-2 bg-gray-100"/>
                        </div>
                        {/* Contact Number */}
                        <div>
                            <label className="block text-sm font-medium">Contact Number</label>
                            <input name="contactNumber" value={profile.contactNumber} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                        {/* Department */}
                        <div>
                            <label className="block text-sm font-medium">Department</label>
                            <input name="department" value={profile.department || ''} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                        {/* Designation */}
                        <div>
                            <label className="block text-sm font-medium">Designation</label>
                            <input name="designation" value={profile.designation || ''} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                        {/* Emergency Contact Name */}
                        <div>
                            <label className="block text-sm font-medium">Emergency Contact Name</label>
                            <input name="emergencyContactName" value={profile.emergencyContactName || ''} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                        {/* Emergency Contact Number */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium">Emergency Contact Number</label>
                            <input name="emergencyContactNumber" value={profile.emergencyContactNumber || ''} onChange={handleChange} className="mt-1 w-full border rounded-lg px-3 py-2"/>
                        </div>
                    </div>
                    <button
                        type="submit"
                        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg"
                    >
                        Save Changes
                    </button>
                </form>
            </div>

            {/* Employee ID Card */}
            <div className="mt-10 flex justify-center">
                <div className="w-64 bg-white shadow-lg rounded-xl p-6 text-center border">
                    <img
                        src={profilePicUrl}
                        alt="Employee"
                        className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-indigo-500"
                    />
                    <h3 className="mt-3 text-lg font-semibold">{profile.name}</h3>
                    <p className="text-gray-600">{profile.designation}</p>
                    <hr className="my-3" />
                    <p className="text-sm">
                        <span className="font-semibold">ID:</span> {profile.id} 
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">Dept:</span> {profile.department}
                    </p>
                    <p className="text-sm">
                        <span className="font-semibold">Contact:</span>{" "}
                        {profile.contactNumber || "N/A"}
                    </p>
                </div>
            </div>
        </div>
    );
}