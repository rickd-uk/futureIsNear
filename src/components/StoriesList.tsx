'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import EditItemModal from './EditItemModal';
import ExpandableText from './ExpandableText';
import type { Story } from '@/types';

export default function StoriesList() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 

  useEffect(() => {
    fetchStories();
  }, [])

  const fetchStories = async () => {
    try {
      const response = await fetch('/api/stories');
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to fetch stories' );
      setStories(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message: 'Failed to load stories' );
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setIsEditModalOpen(true);
    console.log('Edit story', story);
  };

  const handleSaveEdit = async (updatedStory: Story) => {
    try {
      const response = await fetch(`/api/stories/${updatedStory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application.json',
        },
        body: JSON.stringify({
          ...updatedStory,
          timestamp: updatedStory.timestamp || new Date().toISOString()
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to write story');
      }
      setStories(stories.map(story =>
          story.id === updatedStory.id ? { 
            ...updatedStory,
            timestamp: updatedStory.timestamp || new Date().toISOString()
          } : story
      ));
    } catch(err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update story');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Really delete?')) return;

    try {
      const response = await fetch(`/api/stories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete story');
      }

      // remove story from local state 
      setStories(stories.filter(story => story.id !== id));
    } catch(err) {
      alert('Error deleting item');
      console.error('Delete error: ',err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-gray-500">Loading stories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        Error: {error}
      </div>
    );
  }


 return (
   <>
    <EditItemModal
      story={editingStory}
      isOpen={isEditModalOpen}
      onClose={() => {
        setIsEditModalOpen(false);
        setEditingStory(null);
      }}
      onSave={handleSaveEdit}
    />
    <div className="bg-white rounded-lg shadow ">
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-4">Stories List</h2>
        <div>
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
              {stories.map((story) => (
                <tr key={story.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 ">
                    <div className="text-sm font-medium text-gray-900">
                      <a href={story.url} target="_blank" rel="noopener noreferrer" 
                         className="hover:text-blue-600">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                        <ExpandableText text={story.title} maxLength={50} />
                      </div> 
                      </a>
                    </div>
                    <div className="text-sm text-gray-500">
                       <ExpandableText text={story.description} maxLength={60} /> 
                    </div>
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
                  <td className="px-6 py-4  text-sm font-medium">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(story)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </>
  );
}
