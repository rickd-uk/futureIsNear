'use client';

import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';

interface Story {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  category: string;
  author: string;
  timestamp: string;
}

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

const ITEMS_PER_PAGE = 20;

const FutureNews = () => {
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage ] = useState(1);

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      const data: Story[] = await response.json();
      const groupedStories = _.groupBy(data, 'category');
      
      setStories(groupedStories);
      const availableCategories = Object.keys(groupedStories);
      setCategories(availableCategories);
      if (!activeTab && availableCategories.length > 0) {
        setActiveTab(availableCategories[0]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, isNewestFirst]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hour ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getSortedStories = (stories: Story[] = []) => {
    const sorted =  _.orderBy(
      stories,
      [(story) => new Date(story.timestamp)],
      [isNewestFirst ? 'desc' : 'asc']
    );

    // Calculate pagination
    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1 ) * ITEMS_PER_PAGE;
    const paginatedStories = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return {
      stories: paginatedStories,
      totalPages,
      totalStories: sorted.length
    };
  };

    const PaginationControls = ({ currentPage, totalPages, setCurrentPage }: PaginationControlsProps) => (
    <div className="flex justify-center">
      <nav className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-2 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 
                   hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {/* Page numbers */}
        <div className="flex gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-2 py-1 rounded-lg ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className="px-2 py-1 rounded-lg bg-white border border-gray-300 text-gray-700 
                   hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </nav>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading stories...</div>
      </div>
    );
  }

  const { stories: paginatedStories, totalPages, totalStories } = getSortedStories(stories[activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white">FutureIsNear</h1>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between py-2">
            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`px-4 py-2 rounded-sm font-medium transition-colors duration-200 ${
                    activeTab === category
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsNewestFirst(!isNewestFirst)}
              className="px-4 py-2 flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              <span>{isNewestFirst ? 'Newest First' : 'Oldest First'}</span>
              <span className="transform transition-transform duration-200">
                {isNewestFirst ? '↓' : '↑'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Results count */}
        <div className="mb-6 space-y-4">
          <div className="text-sm text-gray-600 mb-4">
            Page {((currentPage - 1) * ITEMS_PER_PAGE) +1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalStories)} of {totalStories} 
          </div>
          {totalPages > 1 && (
            <PaginationControls 
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>


        {/* NEWS LINKS  */}
        <div className="grid gap-4">
          {paginatedStories.map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                {/* Mobile Layout (stacked) */}
                <div className="md:hidden space-y-2">
                  <h2 className="text-lg font-semibold">
                    <a 
                      href={story.url}
                      className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {story.title}
                    </a>
                  </h2>
                  {story.description && (
                    <p className="text-gray-600">{story.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500 space-x-2">
                    <span>{story.author}</span>
                    <span>•</span>
                    <time dateTime={story.timestamp}>
                      {formatTimestamp(story.timestamp)}
                    </time>
                  </div>
                </div>

                {/* Desktop Layout (single row) */}
                <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
                  <h2 className="col-span-4 text-lg font-semibold truncate">
                    <a 
                      href={story.url}
                      className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {story.title}
                    </a>
                  </h2>
                  {story.description && (
                    <p className="col-span-5 text-gray-600 truncate">
                      {story.description}
                    </p>
                  )}
                  <div className="col-span-3 flex items-center justify-end text-sm text-gray-500 space-x-4">
                    <span className="truncate">{story.author}</span>
                    <time dateTime={story.timestamp} className="whitespace-nowrap">
                      {formatTimestamp(story.timestamp)}
                    </time>
                  </div>
                </div>
              </div>
            </article>
          ))}
           
        </div>

       {totalPages > 1 && (
        <div className="mt-6">
          <PaginationControls 
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
          />
        </div>
        )} 
      

      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-gray-400">
              © {new Date().getFullYear()} Science & Tech News. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FutureNews;
