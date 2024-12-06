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

const FutureNews = () => {
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getSortedStories = (stories: Story[] = []) => {
    return _.orderBy(
      stories,
      [(story) => new Date(story.timestamp)],
      [isNewestFirst ? 'desc' : 'asc']
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading stories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-4 sticky top-0 z-50">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white">Science & Tech News</h1>
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
                  className={`px-4 py-2 rounded-full font-medium transition-colors duration-200 ${
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
        <div className="grid gap-4">
          {stories[activeTab] && getSortedStories(stories[activeTab]).map((story) => (
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
