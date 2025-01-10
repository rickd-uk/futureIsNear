'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BulkUpload from '@/components/BulkUpload';
import StoriesList from '@/components/StoriesList';

export default function AdminDashboard() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [stats, setStats] = useState({
    totalStories: 0,
    categoriesCount: 0,
    latestUpload: null
  });

  useEffect(() => {
    const fetchStats = async () => {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    };
    fetchStats();
  }, []);

  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth', {
        method: 'DELETE',
      });
      router.push(`/${process.env.NEXT_PUBLIC_ADMIN_SECRET_PATH}/login`);
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
                <BulkUpload />
              </section>

              {/* Stats Section */}
              <section className="mt-2">
                <h2 className="text-xl font-semibold mb-4 text-gray-600">Quick Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-blue-800 font-medium">Total Stories</h3>
                    <p className="text-2xl font-bold text-blue-900">
                      {stats.totalStories}
                    </p> 
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-green-800 font-medium">Categories</h3>
                     <p className="text-2xl font-bold text-green-900">
                      {stats.categoriesCount}
                    </p> 
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="text-purple-800 font-medium">Latest Upload</h3>
                    <p className="text-2xl font-bold text-purple-900">
                      {stats.latestUpload ? new Date(stats.latestUpload).toLocaleDateString() : '--'}
                    </p> 
                  </div>
                </div>
              </section>

              <section className="mt-2 text-gray-600">
                <StoriesList />
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
