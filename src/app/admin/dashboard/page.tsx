'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import BulkUpload from '@/components/BulkUpload';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 
                       disabled:opacity-50 transition-colors duration-200"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="grid gap-6">
              {/* Bulk Upload Section */}
              <section>
                <h2 className="text-xl font-semibold mb-4">Bulk Upload Stories</h2>
                <BulkUpload />
              </section>

              {/* Stats Section */}
              <section className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-blue-800 font-medium">Total Stories</h3>
                    <p className="text-2xl font-bold text-blue-900">--</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-green-800 font-medium">Categories</h3>
                    <p className="text-2xl font-bold text-green-900">--</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-purple-800 font-medium">Latest Upload</h3>
                    <p className="text-2xl font-bold text-purple-900">--</p>
                  </div>
                </div>
              </section>

              {/* Future Features Section */}
              <section className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 
                             transition-colors duration-200 text-left"
                    disabled
                  >
                    <h3 className="font-medium text-gray-900">Manage Categories</h3>
                    <p className="text-sm text-gray-500">Coming soon</p>
                  </button>
                  <button 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 
                             transition-colors duration-200 text-left"
                    disabled
                  >
                    <h3 className="font-medium text-gray-900">Edit Stories</h3>
                    <p className="text-sm text-gray-500">Coming soon</p>
                  </button>
                  <button 
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 
                             transition-colors duration-200 text-left"
                    disabled
                  >
                    <h3 className="font-medium text-gray-900">User Management</h3>
                    <p className="text-sm text-gray-500">Coming soon</p>
                  </button>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
