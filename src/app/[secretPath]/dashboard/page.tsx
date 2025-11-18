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
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const router = useRouter();

  useEffect(() => {
    fetchStories();
    fetchCategoriesAndAuthors();
  }, []);

  useEffect(() => {
    // Filter stories based on active tab
    if (activeTab === 'All') {
      setFilteredStories(stories);
    } else {
      setFilteredStories(stories.filter(story => story.category === activeTab));
    }
  }, [activeTab, stories]);

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
        const authorsFiltered = data
          .map((s: Story) => s.author)
          .filter((author: string | null): author is string => author !== null);
        const uniqueAuthors = [...new Set<string>(authorsFiltered)]
                setAuthors(uniqueAuthors);
      }
    } catch (error) {
      console.error('Failed to fetch categories and authors:', error);
    }
  };

  const handleStoryAdded = () => {
    fetchStories();
    fetchCategoriesAndAuthors();
    setSelectedStories(new Set()); // Clear selection after stories update
  };

  const handleEditClick = (story: Story) => {
    setSelectedStory(story);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (story: Story) => {
    console.log('handleDeleteClick called with story:', story);
    
    try {
      console.log('Sending DELETE request to:', `/api/stories/${story.id}`);
      const response = await fetch(`/api/stories/${story.id}`, {
        method: 'DELETE',
      });

      console.log('Response received:', response.status, response.ok);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete story');
      }

      // Success - refresh the list AND categories
      console.log('Delete successful, refreshing stories and categories...');
      await fetchStories();
      await fetchCategoriesAndAuthors();
    } catch (error) {
      console.error('Error deleting story:', error);
      alert(`Failed to delete story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleSelectStory = (storyId: string) => {
    const newSelected = new Set(selectedStories);
    if (newSelected.has(storyId)) {
      newSelected.delete(storyId);
    } else {
      newSelected.add(storyId);
    }
    setSelectedStories(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedStories.size === filteredStories.length && filteredStories.length > 0) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(filteredStories.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    console.log('handleBulkDelete called with selection:', Array.from(selectedStories));
    if (selectedStories.size === 0) {
      alert('Please select at least one story to delete.');
      return;
    }

    try {
      console.log('Starting bulk delete for', selectedStories.size, 'stories');
      // Delete all selected stories
      const deletePromises = Array.from(selectedStories).map(async (storyId) => {
        console.log('Deleting story:', storyId);
        const response = await fetch(`/api/stories/${storyId}`, { 
          method: 'DELETE' 
        });
        return { storyId, success: response.ok };
      });

      const results = await Promise.all(deletePromises);
      console.log('Bulk delete results:', results);
      const failedDeletes = results.filter(r => !r.success);

      if (failedDeletes.length > 0) {
        alert(
          `Successfully deleted ${results.length - failedDeletes.length} stories.\n` +
          `Failed to delete ${failedDeletes.length} stories.`
        );
      }

      // Clear selection and refresh both stories and categories
      setSelectedStories(new Set());
      await fetchStories();
      await fetchCategoriesAndAuthors();
    } catch (error) {
      console.error('Error during bulk delete:', error);
      alert(`An error occurred while deleting stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              + Add Story
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-300 text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Compact */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        {/* CSV Upload Section - Collapsible */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => setShowCsvUpload(!showCsvUpload)}
            className="w-full px-4 py-2.5 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-900">CSV Upload</h2>
            <span className="text-gray-500 text-sm">
              {showCsvUpload ? '▼' : '▶'}
            </span>
          </button>
          {showCsvUpload && (
            <div className="px-4 pb-3 border-t border-gray-100">
              <CSVUpload onUploadComplete={handleStoryAdded} />
            </div>
          )}
        </div>

        {/* Category Management Section - Collapsible */}
        <div className="bg-white rounded-lg shadow">
          <button
            onClick={() => setShowCategoryManagement(!showCategoryManagement)}
            className="w-full px-4 py-2.5 flex justify-between items-center hover:bg-gray-50 transition-colors"
          >
            <h2 className="text-sm font-semibold text-gray-900">Manage Categories</h2>
            <span className="text-gray-500 text-sm">
              {showCategoryManagement ? '▼' : '▶'}
            </span>
          </button>
          {showCategoryManagement && (
            <div className="px-4 pb-3 border-t border-gray-100">
              <CategoryManagement 
                categories={categories} 
                onCategoryUpdated={handleStoryAdded}
              />
            </div>
          )}
        </div>

        {/* Bulk Actions Bar */}
        {selectedStories.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedStories.size} {selectedStories.size === 1 ? 'story' : 'stories'} selected
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Bulk delete clicked, selected:', selectedStories.size);
                handleBulkDelete();
              }}
              type="button"
              className="bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Delete Selected
            </button>
          </div>
        )}

        {/* Stories Table - Compact */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Stories</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Total: {stories.length} stories
              </p>
            </div>
          </div>

          {loading ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              Loading stories...
            </div>
          ) : stories.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">
              No stories yet. Click &quot;Add Story&quot; to create your first one.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">
                      <input
                        type="checkbox"
                        checked={selectedStories.size === stories.length && stories.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stories.slice(0, 20).map((story) => (
                    <tr key={story.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={selectedStories.has(story.id)}
                          onChange={() => handleSelectStory(story.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-2">
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
                            <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                              {story.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {story.category}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {story.author || 'Unknown'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-500">
                        {new Date(story.timestamp).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Edit clicked for story:', story.id);
                              handleEditClick(story);
                            }}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                            title="Edit story"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Delete clicked for story:', story.id);
                              handleDeleteClick(story);
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Delete story"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
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
          fetchCategoriesAndAuthors();
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
