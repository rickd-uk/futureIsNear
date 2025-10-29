// src/components/CategoryManagement.tsx
'use client';

import React, { useState } from 'react';

interface CategoryManagementProps {
  categories: string[];
  onCategoryUpdated: () => void;
}

export default function CategoryManagement({ categories, onCategoryUpdated }: CategoryManagementProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [deletingCategory, setDeletingCategory] = useState<string | null>(null);
  const [deleteAssociatedStories, setDeleteAssociatedStories] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRenameClick = (category: string) => {
    setEditingCategory(category);
    setNewName(category);
    setError('');
    setSuccess('');
  };

  const handleCancelRename = () => {
    setEditingCategory(null);
    setNewName('');
    setError('');
  };

  const handleRenameSubmit = async (oldName: string) => {
    if (!newName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    if (newName.trim() === oldName) {
      handleCancelRename();
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName: newName.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to rename category');
      }

      setSuccess(`Category renamed successfully. ${data.updatedCount} stories updated.`);
      setEditingCategory(null);
      setNewName('');
      onCategoryUpdated();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rename category');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteClick = (category: string) => {
    setDeletingCategory(category);
    setDeleteAssociatedStories(false);
    setError('');
    setSuccess('');
  };

  const handleCancelDelete = () => {
    setDeletingCategory(null);
    setDeleteAssociatedStories(false);
    setError('');
  };

  const handleDeleteConfirm = async (categoryName: string) => {
    setIsProcessing(true);
    setError('');

    try {
      const response = await fetch(`/api/categories/${encodeURIComponent(categoryName)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deleteStories: deleteAssociatedStories }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      if (deleteAssociatedStories) {
        setSuccess(`Category deleted and ${data.deletedStoriesCount} associated stories removed.`);
      } else {
        setSuccess(`Category removed from ${data.updatedStoriesCount} stories (set to "Uncategorized").`);
      }

      setDeletingCategory(null);
      setDeleteAssociatedStories(false);
      onCategoryUpdated();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    } finally {
      setIsProcessing(false);
    }
  };

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Manage Categories</h3>

      {/* Success Message */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((category) => (
          <div
            key={category}
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {editingCategory === category ? (
              /* Rename Mode */
              <div className="space-y-3">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="New category name"
                  disabled={isProcessing}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenameSubmit(category)}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelRename}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : deletingCategory === category ? (
              /* Delete Confirmation Mode */
              <div className="space-y-3">
                <p className="text-sm text-gray-700 font-medium">
                  Delete &quot;{category}&quot;?
                </p>
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={deleteAssociatedStories}
                    onChange={(e) => setDeleteAssociatedStories(e.target.checked)}
                    disabled={isProcessing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Also delete all stories in this category</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteConfirm(category)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Display Mode */
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                  {category}
                </span>
                <div className="flex gap-2 ml-2">
                  <button
                    onClick={() => handleRenameClick(category)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    title="Rename category"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                    title="Delete category"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-4">
        <strong>Note:</strong> Renaming a category will update all stories with that category. 
        Deleting a category will either remove the stories or set them to &quot;Uncategorized&quot;.
      </p>
    </div>
  );
}
