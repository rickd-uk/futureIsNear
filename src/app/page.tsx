// src/components/FutureNews.tsx
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

export default function FutureNews() {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInDescription, setSearchInDescription] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setAllStories(data);
        setFilteredStories(data);
      }
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter stories whenever search parameters change
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStories(allStories);
      return;
    }

    const filtered = allStories.filter((story) => {
      const fieldsToSearch: string[] = [];
      
      if (searchInTitle && story.title) {
        fieldsToSearch.push(story.title);
      }
      
      if (searchInDescription && story.description) {
        fieldsToSearch.push(story.description);
      }

      if (fieldsToSearch.length === 0) {
        return false;
      }

      let pattern: RegExp;
      
      if (wholeWords) {
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regexFlags = caseSensitive ? 'g' : 'gi';
        pattern = new RegExp(`\\b${escapedQuery}\\b`, regexFlags);
      } else {
        const regexFlags = caseSensitive ? 'g' : 'gi';
        const escapedQuery = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        pattern = new RegExp(escapedQuery, regexFlags);
      }

      return fieldsToSearch.some((field) => {
        if (wholeWords || !caseSensitive) {
          return pattern.test(field);
        } else {
          return field.includes(searchQuery);
        }
      });
    });

    setFilteredStories(filtered);
  }, [searchQuery, searchInTitle, searchInDescription, caseSensitive, wholeWords, allStories]);

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Future News</h1>
          <p className="text-gray-600 mt-1">Browse and search through our collection</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Box */}
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
                {filteredStories.length > 0 ? (
                  <span>
                    Found <strong>{filteredStories.length}</strong> matching {filteredStories.length === 1 ? 'story' : 'stories'}
                  </span>
                ) : (
                  <span className="text-red-600">No stories match your search</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stories Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading stories...
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No stories found.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredStories.map((story) => (
                <article
                  key={story.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title and Category */}
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                          {story.category}
                        </span>
                        <h2 className="text-lg font-semibold text-gray-900 truncate">
                          <a
                            href={story.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 transition-colors"
                          >
                            {story.title}
                          </a>
                        </h2>
                      </div>

                      {/* Description */}
                      {story.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {story.description}
                        </p>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          {story.author || 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(story.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* External Link Icon */}
                    <a
                      href={story.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                      title="Open in new tab"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
