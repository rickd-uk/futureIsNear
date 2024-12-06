'use client';

import React, { useState, useEffect } from 'react';
import _ from 'lodash';

// Import your existing BulkUpload component
// You'll need to adjust the import path based on your file structure
import BulkUpload from './BulkUpload';

const NewsWebsite = () => {
  const [stories, setStories] = useState({});
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [isNewestFirst, setIsNewestFirst] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      
      if (!response.ok) {
        throw new Error('Failed to fetch stories');
      }
      
      const data = await response.json();
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
  };

  useEffect(() => {
    fetchStories();
  }, []); // Initial fetch

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const getSortedStories = (stories = []) => {
    return _.orderBy(
      stories,
      [(story) => new Date(story.timestamp)],
      [isNewestFirst ? 'desc' : 'asc']
    );
  };

  const handleUploadComplete = () => {
    fetchStories(); // Refresh the stories after successful upload
    setShowUpload(false); // Hide the upload form
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
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Science & Tech News</h1>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2 bg-white text-blue-600 rounded-full hover:bg-blue-50 transition-colors duration-200"
          >
            {showUpload ? 'Hide Upload' : 'Upload Stories'}
          </button>
        </div>
      </header>

      {/* Upload Form */}
      {showUpload && (
        <div className="container mx-auto px-4 mt-4">
          <BulkUpload onUploadComplete={handleUploadComplete} />
        </div>
      )}

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
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">
                      <a 
                        href={story.url}
                        className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {story.title}
                      </a>
                    </h2>
                    <p className="text-gray-600 line-clamp-2 mb-2">
                      {story.description}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span>{story.author}</span>
                      <span>•</span>
                      <time dateTime={story.timestamp}>
                        {formatTimestamp(story.timestamp)}
                      </time>
                      {story.points && (
                        <>
                          <span>•</span>
                          <span>{story.points} points</span>
                        </>
                      )}
                      {story.comments && (
                        <>
                          <span>•</span>
                          <span>{story.comments} comments</span>
                        </>
                      )}
                    </div>
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

export default NewsWebsite;
