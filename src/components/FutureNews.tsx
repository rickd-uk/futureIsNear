'use client';

import React, { useState, useEffect } from 'react';
//import { format } from 'date-fns';
import _ from 'lodash';

interface Story {
  id: string;
    title: string;
  url: string;
  author: string;
  description: string;
  timestamp: string;
  category: string;
}

export default function FutureNews() {
  const [stories, setStories] = useState<Record<string, Story[]>>({});
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/stories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch stories');
        }
        
        const data: Story[] = await response.json();
        
        // Group stories by category
        const groupedStories = _.groupBy(data, 'category');
        
        setStories(groupedStories);
        const availableCategories = Object.keys(groupedStories);
        setCategories(availableCategories);
        setActiveTab(availableCategories[0]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading stories');
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  //const formatTimestamp = (timestamp: string) => {
  //  const date = new Date(timestamp);
  //  const now = new Date();
  //  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  //
  //  if (diffInHours < 1) return 'just now';
  //  if (diffInHours === 1) return '1 hour ago';
  //  if (diffInHours < 24) return `${diffInHours} hours ago`;
  //  return `${Math.floor(diffInHours / 24)} days ago`;
  //};

  const getSortedStories = (stories: Story[] = []) => {
    return _.orderBy(
      stories,
      [(story) => new Date(story.timestamp)],
      [isNewestFirst ? 'desc' : 'asc']
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading links...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-900 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold text-white">Future Is Near - TEST</h1>
        </div>
      </header>

      <nav className="bg-white shadow">
        <div className="container mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveTab(category)}
                  className={`px-4 py-2 font-medium ${
                    activeTab === category
                      ? 'text-orange-500 border-b-2 border-orange-500'
                      : 'text-gray-500 hover:text-orange-500'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsNewestFirst(!isNewestFirst)}
              className="px-4 py-2 flex items-center space-x-2 text-gray-600 hover:text-orange-500"
            >
              <span>{isNewestFirst ? 'Newest First' : 'Oldest First'}</span>
              <span className="inline-block transform rotate-0">↕</span>
            </button>
          </div>
        </div>
      </nav>


      <main className="container mx-auto mt-6">
  <div className="bg-white rounded-lg shadow">
    {stories[activeTab] && getSortedStories(stories[activeTab]).map((story) => (
      <div
        key={story.id}
        className="p-4 border-b border-gray-200 last:border-b-0"
      >
        {/* Responsive Flex Container */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          {/* Title Section */}
          <h2 className="text-lg font-medium mb-2 lg:mb-0">
            <a 
              href={story.url} 
              className="text-gray-900 hover:text-orange-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              {story.title}
            </a>
          </h2>
          {/* Description Section */}
          <p className="text-gray-700 lg:flex-1 lg:ml-4 lg:truncate">
            {story.description}
          </p>
          {/* Date Section */}
          <p className="text-sm text-gray-500 mt-2 lg:mt-0 lg:ml-4">
            {new Intl.DateTimeFormat('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true,
            }).format(new Date(story.timestamp))}
          </p>
        </div>
      </div>
    ))}
  </div>
</main>


    </div>
  );
}
