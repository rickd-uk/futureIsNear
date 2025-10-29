'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AddStoryModal from '@/components/AddStoryModal';
import EditStoryModal from '@/components/EditStoryModal';
import CSVUpload from '@/components/CSVUpload';
import CategoryManagement from '@/components/CategoryManagement';

interface Story {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string | null;
  description: string | null;
  timestamp: string;
}

export default function AdminDashboard() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchStories();
    fetchCategoriesAndAuthors();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoriesAndAuthors = async () => {
    try {
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        
        // Extract unique categories
        const uniqueCategories = [...new Set(data.map((s: Story) => s.category))];
        setCategories(uniqueCategories as string[]);
        
        // Extract unique authors (filter out nulls)
        const uniqueAuthors = [...new Set(
          data
            .map((s: Story) => s.author)
            .filter((author): author is string => author !== null)
        )];
        setAuthors(uniqueAuthors);
      }
    } catch (error) {
      console.error('Failed to fetch categories and authors:', error);
    }
  };

  const handleStoryAdded = () => {
    fetchStories();
    fetchCategoriesAndAuthors();
  };

  const handleEditClick = (story: Story) => {
    setSelectedStory(story);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (story: Story) => {
    try {
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the stories list
        fetchStories();
      } else {
        throw new Error('Failed to delete story');
      }
    } catch (error) {
      console.error('Error deleting story:', error);
      alert('Failed to delete story. Please try again.');
    }
  };

  const handleLogout = () => {
    // Clear auth token
    localStorage.removeItem('admin_token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              + Add Story
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* CSV Upload Section */}
        <CSVUpload onUploadComplete={handleStoryAdded} />

        {/* Category Management Section */}
        <CategoryManagement 
          categories={categories} 
          onCategoryUpdated={handleStoryAdded}
        />

        {/* Stories Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Recent Stories</h2>
            <p className="text-sm text-gray-500 mt-1">
              Total: {stories.length} stories
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Loading stories...
            </div>
          ) : stories.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No stories yet. Click "Add Story" to create your first one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stories.slice(0, 20).map((story) => (
                    <tr key={story.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <a
                            href={story.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {story.title}
                          </a>
                          {story.description && (
                            <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                              {story.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {story.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {story.author || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(story.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleEditClick(story)}
                          className="text-blue-600 hover:text-blue-800 mr-3 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(story)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Story Modal */}
      <AddStoryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleStoryAdded}
      />

      {/* Edit Story Modal */}
      <EditStoryModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedStory(null);
        }}
        onSuccess={() => {
          fetchStories();
          setIsEditModalOpen(false);
          setSelectedStory(null);
        }}
        story={selectedStory}
        categories={categories}
        authors={authors}
      />
    </div>
  );
}
