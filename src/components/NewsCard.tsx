'use client';

import React, { useState } from 'react';

interface NewsCardProps {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  author: string;
  timestamp: string;
  favorited: boolean;
  formatTimestamp: (timestamp: string) => string;
}

const NewsCard: React.FC<NewsCardProps> = ({
  id,
  title,
  url,
  description,
  author,
  timestamp,
  favorited: initialFavorited,
  formatTimestamp,
}) => {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isToggling, setIsToggling] = useState(false);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isToggling) return;
    
    setIsToggling(true);
    
    try {
      const response = await fetch(`/api/stories/${id}/favorite`, {
        method: 'PATCH',
      });
      
      if (response.ok) {
        const updatedStory = await response.json();
        setFavorited(updatedStory.favorited);
      } else {
        console.error('Failed to toggle favorite');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        {/* Mobile Layout (stacked) */}
        <div className="md:hidden space-y-2">
          <div className="flex items-start gap-2">
            <button
              onClick={toggleFavorite}
              disabled={isToggling}
              className="flex-shrink-0 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all disabled:opacity-50"
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-5 h-5 transition-colors ${
                  favorited 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-none text-gray-400 hover:text-yellow-400'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold flex-1">
              <a 
                href={url}
                className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            </h2>
          </div>
          {description && (
            <p className="text-gray-600 ml-7">{description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 space-x-2 ml-7">
            <span>{author}</span>
            <span>•</span>
            <time dateTime={timestamp}>
              {formatTimestamp(timestamp)}
            </time>
          </div>
        </div>

        {/* Desktop Layout (single row) */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
          <div className="col-span-4 flex items-center gap-2">
            <button
              onClick={toggleFavorite}
              disabled={isToggling}
              className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded transition-all disabled:opacity-50"
              aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
            >
              <svg
                className={`w-5 h-5 transition-colors ${
                  favorited 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-none text-gray-400 hover:text-yellow-400'
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
            <h2 className="text-lg font-semibold truncate flex-1">
              <a 
                href={url}
                className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                {title}
              </a>
            </h2>
          </div>
          {description && (
            <p className="col-span-5 text-gray-600 truncate">
              {description}
            </p>
          )}
          <div className="col-span-3 flex items-center justify-end text-sm text-gray-500 space-x-4">
            <span className="truncate">{author}</span>
            <time dateTime={timestamp} className="whitespace-nowrap">
              {formatTimestamp(timestamp)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
};

export default NewsCard;
