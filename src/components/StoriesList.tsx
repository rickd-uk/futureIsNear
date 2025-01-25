// src/components/StoriesList.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import EditItemModal from './EditItemModal';
import ExpandableText from './ExpandableText';
import TruncatedText from './TruncatedText';
import type { Story } from '@/types';

interface StoriesListProps {
  onDeleteSuccess?: () => void;
}

export default function StoriesList({ onDeleteSuccess }: StoriesListProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);
  const [fetchState, setFetchState] = useState<'idle' | 'fetching' | 'done'>('idle');

    const fetchStories = useCallback(async () => {
    if (fetchState !== 'idle') return;
  
     setFetchState('fetching');
    try {
      console.log('Fetching stories...');
      const response = await fetch('/api/stories');
      const result = await response.json();

      console.log('Fetch response:', result);
      if (!response.ok) throw new Error(result.error || 'Failed to fetch stories');
      setStories(result.data || []);
      setFetchState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stories');
      setFetchState('done');
    } finally {
      console.log('Before setting loading:', loading);
      setLoading(false);
      console.log('After setting loading:', loading);
    }
  }, [loading, fetchState]);

  


  useEffect(() => {
    if (fetchState !== 'idle') return; // Prevent re-triggering
    console.log('useEffect triggered, fetching stories...');
    setLoading(true); // Reset loading state
    fetchStories();
  }, [fetchKey, fetchStories, fetchState]);



  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setIsEditModalOpen(true);
    console.log('Edit story', story);
  };

  const handleDeleteAll = async (): Promise<void> => {
    const confirmMessage = `Are you sure you want to delete all ${stories.length} stories? This action cannot be undone.`;
    if (!confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      console.log('Attempting to delete all stories');
      const response = await fetch('/api/stories', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete all stories');
      }

      setStories([]);
      if (onDeleteSuccess) {
      console.log('Calling onDeleteSuccess callback'); // Debug log
      onDeleteSuccess();
    } else {
      console.log('onDeleteSuccess callback not provided'); // Debug log
    }
    setFetchKey(prev => prev + 1);
    } catch (err) {
      alert('Error deleting stories');
      console.error('Delete all error:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveEdit = async (updatedStory: Story) => {
    try {
      const response = await fetch(`/api/stories/${updatedStory.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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
      onDeleteSuccess?.();
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
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Stories List</h2>
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting || stories.length === 0}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isDeleting ? 'Deleting...' : 'Delete All Stories'}
            </button>
          </div>
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
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      <a href={story.url} target="_blank" rel="noopener noreferrer" 
                         className="hover:text-blue-600">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          <TruncatedText text={story.title} maxLength={25} />
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
                  <td className="px-6 py-4 text-sm font-medium">
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
    </>
  );
}
