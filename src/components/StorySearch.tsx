// src/components/StorySearch.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface Story {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string | null;
  description: string | null;
  timestamp: string;
}

interface StorySearchProps {
  stories: Story[];
  onFilteredResults: (filtered: Story[]) => void;
}

export default function StorySearch({ stories, onFilteredResults }: StorySearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInDescription, setSearchInDescription] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);

  // Filter stories whenever search parameters change
  useEffect(() => {
    if (!searchQuery.trim()) {
      onFilteredResults(stories);
      return;
    }

    const filtered = stories.filter((story) => {
      // Determine which fields to search
      const fieldsToSearch: string[] = [];
      
      if (searchInTitle && story.title) {
        fieldsToSearch.push(story.title);
      }
      
      if (searchInDescription && story.description) {
        fieldsToSearch.push(story.description);
      }

      // If no fields selected, search nothing
      if (fieldsToSearch.length === 0) {
        return false;
      }

      // Prepare search query
      let query = searchQuery;
      
      // Create regex pattern for whole words if needed
      let pattern: RegExp;
      
      if (wholeWords) {
        // Escape special regex characters in the query
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexFlags = caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(`\\b${escapedQuery}\\b`, regexFlags);
      } else {
        const regexFlags = caseSensitive ? 'g' : 'gi';
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escapedQuery, regexFlags);
      }

      // Check if any field matches
      return fieldsToSearch.some((field) => {
        if (wholeWords || !caseSensitive) {
          return pattern.test(field);
        } else {
          // For case-sensitive non-whole-word search, use includes
          return field.includes(query);
        }
      });
    });

    onFilteredResults(filtered);
  }, [searchQuery, searchInTitle, searchInDescription, caseSensitive, wholeWords, stories, onFilteredResults]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
      <div className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stories..."
            className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Search Options */}
        <div className="flex flex-wrap gap-6">
          {/* Search Fields */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Search in:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchInTitle}
                onChange={(e) => setSearchInTitle(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700">Title</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={searchInDescription}
                onChange={(e) => setSearchInDescription(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700">Description</span>
            </label>
          </div>

          {/* Divider */}
          <div className="border-l border-gray-300"></div>

          {/* Search Options */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Options:</span>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700">Case sensitive</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wholeWords}
                onChange={(e) => setWholeWords(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm text-gray-700">Whole words</span>
            </label>
          </div>
        </div>

        {/* Results Count */}
        {searchQuery && (
          <div className="text-sm text-gray-600">
            {stories.length > 0 ? (
              <span>
                Found <strong>{stories.length}</strong> matching {stories.length === 1 ? 'story' : 'stories'}
              </span>
            ) : (
              <span className="text-red-600">No stories match your search</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
