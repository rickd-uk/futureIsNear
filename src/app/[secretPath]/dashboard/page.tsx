'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Story {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadError, setUploadError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/');
      return;
    }

    fetchStories();
  }, [router]);

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setStories(stories.filter(story => story.id !== id));
      }
    } catch (error) {
      console.error('Error deleting story:', error);
    }
  };

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file');
      return;
    }

    setUploadStatus('Uploading...');
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/stories/bulk', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      setUploadStatus(result.message || 'Upload successful');
      fetchStories(); // Refresh the list
      event.target.value = ''; // Reset file input
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
      setUploadStatus('');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL stories? This cannot be undone!')) return;

    try {
      const response = await fetch('/api/stories/clear', {
        method: 'DELETE',
      });

      if (response.ok) {
        setStories([]);
        alert('All stories deleted successfully');
      }
    } catch (error) {
      console.error('Error clearing stories:', error);
      alert('Failed to clear stories');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Bulk Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">Bulk Upload Stories (CSV)</h2>
          
          <div className="space-y-4">
            <div>
              <label 
                htmlFor="csv-upload" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Choose CSV file
              </label>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleBulkUpload}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
              />
            </div>

            {uploadStatus && (
              <div className="text-green-600">{uploadStatus}</div>
            )}

            {uploadError && (
              <div className="text-red-600">{uploadError}</div>
            )}

            <div className="text-sm text-gray-500">
              <p>Required CSV columns: title, url, category</p>
              <p>Optional columns: description, author</p>
            </div>
          </div>
        </div>

        {/* Stories Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Manage Stories ({stories.length} total)
            </h2>
            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Clear All Stories
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stories.map((story) => (
                  <tr key={story.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <a href={story.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {story.title}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {story.category}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {story.author}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(story.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
