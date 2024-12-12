'use client'

import React, { useState, useRef} from 'react';

interface ExpandableTextProps {
  text: string | null | undefined;
  maxLength: number;
}

export default function ExpandableText({ text, maxLength }: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!text) return null;

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
     <div ref={containerRef} className="relative">
      <span>
        {text.slice(0, maxLength)}...{' '}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-block"
        >
          {isExpanded ? 'Show less' : 'Read more'}
        </button>
      </span>

      {isExpanded && (
        <div className="absolute z-50 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4  w-[500px] mt-2">
          <div className="max-h-98 overflow-y-auto">
            <p className="whitespace-normal break-words text-md leading-relaxed">
              {text}
            </p>
          </div>
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
