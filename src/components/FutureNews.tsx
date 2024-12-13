'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import _ from 'lodash';
import ResponsiveNav from '../components/ResponsiveNav';
import PaginationControls from '../components/PaginationControls';
import NewsCard from '../components/NewsCard';

interface Story {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  category: string;
  author: string;
  timestamp: string;
}

const ITEMS_PER_PAGE = 20;

const FutureNews = () => {
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
 
  const fetchStories = useCallback(async () => {
    // If data is less than 5 minutes old, don't refetch
    if (lastFetch && (new Date().getTime() - lastFetch.getTime()) < 300000) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok) throw new Error('Failed to fetch stories');
      
      const { data } = await response.json();
      const groupedStories = _.groupBy(data, 'category');
      const availableCategories = Object.keys(groupedStories);

      setCategories(availableCategories);
      setStories(groupedStories);
      setLastFetch(new Date());

      // Only set activeTab if it's not already set and we have categories
      if (!activeTab && availableCategories.length > 0) {
        setActiveTab(availableCategories[0]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetch, activeTab]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, isNewestFirst]);

  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  }, []);

  const { paginatedStories, totalPages, totalStories } = useMemo(() => {
    const currentStories = stories[activeTab] || [];
    const sorted = _.orderBy(
      currentStories,
      [(story) => new Date(story.timestamp)],
      [isNewestFirst ? 'desc' : 'asc']
    );

    const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedStories = sorted.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return {
      paginatedStories,
      totalPages,
      totalStories: sorted.length
    };
  }, [stories, activeTab, isNewestFirst, currentPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white">FutureIsNear</h1>
        </div>
      </header>

      <ResponsiveNav 
        categories={categories}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="container mx-auto px-4 py-6">
        {totalStories > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-blue-600">
              {`${((currentPage - 1) * ITEMS_PER_PAGE) + 1} - ${
                Math.min(currentPage * ITEMS_PER_PAGE, totalStories)
              }${currentPage !== Math.ceil(totalStories / ITEMS_PER_PAGE) ? ` / ${totalStories}` : ''}`}
            </div>
            <button
              onClick={() => setIsNewestFirst(!isNewestFirst)}
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
            >
              Sort: {isNewestFirst ? 'Newest ↓' : 'Oldest ↑'}
            </button>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mb-6">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}

        <div className="grid gap-3">
          {paginatedStories.map((story) => (
            <NewsCard
              key={story.id}
              {...story}
              formatTimestamp={formatTimestamp}
            />
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
