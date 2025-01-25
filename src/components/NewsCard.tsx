// src/components/NewCard.tsx


import React from 'react';
import ExpandableText from './ExpandableText';

interface NewsCardProps {
  id: string;
  title: string;
  url: string;
  description?: string | null;
  author: string;
  category: string;
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
    <article className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-visible">
      <div className="p-3">
        {/* Mobile Layout (stacked) */}
        <div className="md:hidden space-y-1.5">
          <h2 className="text-base font-semibold">
            <a 
              href={url}
              className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="relative">
                <ExpandableText text={title} maxLength={60} />
              </div>
            </a>
          </h2>
          {description && (
            <div className="text-gray-600 relative text-sm">
              <ExpandableText text={description} maxLength={30} />
            </div>
          )}
          <div className="flex flex-wrap items-center text-xs text-gray-500 gap-2">
            <span className="truncate max-w-[120px]">{author}</span>
            <span>•</span>
            <time dateTime={timestamp}>
              {formatTimestamp(timestamp)}
            </time>
          </div>
        </div>

        {/* Desktop Layout (single row) */}
        <div className="hidden md:flex md:items-center md:gap-3 h-10">
          <div className="w-5/12 min-w-0">
            <h2 className="text-base font-semibold">
              <a 
                href={url}
                className="text-gray-900 hover:text-blue-600 transition-colors duration-200"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="relative">
                  <ExpandableText text={title} maxLength={100} />
                </div>
              </a>
            </h2>
          </div>
          
          {description && (
            <div className="w-4/12 min-w-0">
              <div className="text-gray-600 relative text-sm">
                <ExpandableText text={description} maxLength={30} />
              </div>
            </div>
          )}
          
          <div className="w-3/12 min-w-0 flex items-center justify-end gap-3 text-xs text-gray-500">
            <span className="truncate max-w-[120px]">{author}</span>
            <time dateTime={timestamp} className="text-gray-400 whitespace-nowrap">
              {formatTimestamp(timestamp)}
            </time>
          </div>
        </div>
      </div>
    </article>
  );
};

export default React.memo(NewsCard);
