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
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleRenameClick = (category: string) => {
    setEditingCategory(category);
    setNewName(category);
    setError('');
    setSuccess('');
    setIsAddingCategory(false);
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
    setIsAddingCategory(false);
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

  const handleAddCategoryClick = () => {
    setIsAddingCategory(true);
    setNewCategoryName('');
    setError('');
    setSuccess('');
    setEditingCategory(null);
    setDeletingCategory(null);
  };

  const handleCancelAdd = () => {
    setIsAddingCategory(false);
    setNewCategoryName('');
    setError('');
  };

  const handleAddCategorySubmit = async () => {
    if (!newCategoryName.trim()) {
      setError('Category name cannot be empty');
      return;
    }

    // Check if category already exists
    if (categories.includes(newCategoryName.trim())) {
      setError('Category already exists');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create a dummy story with the new category to add it to the system
      // Note: This is a workaround. You might want to add a proper API endpoint for adding categories
      setSuccess(`Category "${newCategoryName.trim()}" will be available when you add a story with this category.`);
      setIsAddingCategory(false);
      setNewCategoryName('');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setIsProcessing(false);
    }
  };

  if (categories.length === 0 && !isAddingCategory) {
    return (
      <div className="py-3">
        <button
          onClick={handleAddCategoryClick}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          + Add Category
        </button>
        <p className="text-xs text-gray-500 mt-2">No categories yet. Add your first category!</p>
      </div>
    );
  }

  return (
    <div className="py-3">
      {/* Add Category Button */}
      <div className="mb-3 flex justify-between items-center">
        <button
          onClick={handleAddCategoryClick}
          disabled={isAddingCategory}
          className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors disabled:opacity-50"
        >
          + Add Category
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Add Category Form */}
      {isAddingCategory && (
        <div className="mb-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
          <div className="space-y-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              placeholder="New category name"
              disabled={isProcessing}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCategorySubmit}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Adding...' : 'Add'}
              </button>
              <button
                onClick={handleCancelAdd}
                disabled={isProcessing}
                className="flex-1 bg-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-400 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
        {categories.map((category) => (
          <div
            key={category}
            className="border border-gray-200 rounded-lg p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            {editingCategory === category ? (
              /* Rename Mode */
              <div className="space-y-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
                  placeholder="New category name"
                  disabled={isProcessing}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRenameSubmit(category)}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelRename}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : deletingCategory === category ? (
              /* Delete Confirmation Mode */
              <div className="space-y-2">
                <p className="text-xs text-gray-700 font-medium">
                  Delete &quot;{category}&quot;?
                </p>
                <label className="flex items-center space-x-2 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={deleteAssociatedStories}
                    onChange={(e) => setDeleteAssociatedStories(e.target.checked)}
                    disabled={isProcessing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Also delete stories</span>
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDeleteConfirm(category)}
                    disabled={isProcessing}
                    className="flex-1 bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                  >
                    {isProcessing ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={handleCancelDelete}
                    disabled={isProcessing}
                    className="flex-1 bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-400 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Normal Display Mode with Icon Buttons */
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-900 truncate flex-1">
                  {category}
                </span>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => handleRenameClick(category)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                    title="Rename category"
                    type="button"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(category)}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                    title="Delete category"
                    type="button"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-3">
        <strong>Note:</strong> Renaming updates all stories. Deleting removes or sets stories to &quot;Uncategorized&quot;.
      </p>
    </div>
  );
}
