'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  const [currentPage, setCurrentPage ] = useState(1);
 
  const fetchStories = useCallback(async () => {
    // If data is less than 5 minutes old, don't refetch
    if (lastFetch && (new Date().getTime() - lastFetch.getTime()) < 300000) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok)  throw new Error('Failed to fetch stories');
      
      const data: Story[] = await response.json();
      const groupedStories = _.groupBy(data, 'category');
      const availableCategories = Object.keys(groupedStories);

      setCategories(availableCategories);
      setStories(groupedStories);
      setLastFetch(new Date());

      if (!activeTab && availableCategories.length > 0) {
        setActiveTab(availableCategories[0]);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
    } finally {
      setLoading(false);
    }
  }, [lastFetch,  activeTab]);

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
      <ResponsiveNav 
        categories={categories}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Sort Control */}
       <div className="flex items-center justify-between mb-4">
       <div className="text-blue-600">
        {(() => {
          const start = ((currentPage - 1) * ITEMS_PER_PAGE) + 1;
          const end = Math.min(currentPage * ITEMS_PER_PAGE, totalStories);
          const lastPage = currentPage === Math.ceil(totalStories / ITEMS_PER_PAGE);
          
          return `${start} - ${end}${!lastPage ? ` / ${totalStories}` : ''}`;
        })()}
      </div>
          <button
            onClick={() => setIsNewestFirst(!isNewestFirst)}
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors duration-200"
          >
            Sort: {isNewestFirst ? 'Newest ↓' : 'Oldest ↑'}
          </button>
        </div> 

       {/* pagination */}
        <div className="mb-6 space-y-4">
                    {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              setCurrentPage={setCurrentPage}
            />
          )}
        </div>

        {/* News Cards */}
        <div className="grid gap-4">
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
