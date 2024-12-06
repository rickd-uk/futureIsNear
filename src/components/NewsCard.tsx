'use client';

import React from 'react';

interface NewsCardProps {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  author: string;
  timestamp: string;
  formatTimestamp: (timestamp: string) => string;
}

const NewsCard: React.FC<NewsCardProps> = ({
  title,
  url,
  description,
  author,
  timestamp,
  formatTimestamp,
}) => {
  return (
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-4">
        {/* Mobile Layout (stacked) */}
        <div className="md:hidden space-y-2">
          <h2 className="text-lg font-semibold">
            <a 
              href={url}
              className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </a>
          </h2>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
          <div className="flex items-center text-sm text-gray-500 space-x-2">
            <span>{author}</span>
            <span>•</span>
            <time dateTime={timestamp}>
              {formatTimestamp(timestamp)}
            </time>
          </div>
        </div>

        {/* Desktop Layout (single row) */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-center">
          <h2 className="col-span-4 text-lg font-semibold truncate">
            <a 
              href={url}
              className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              {title}
            </a>
          </h2>
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
