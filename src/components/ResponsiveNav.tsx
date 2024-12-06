'use client';

import React, {useState, useRef, useEffect, useCallback } from 'react';
import { MoreHorizontal, ChevronDown } from 'lucide-react';

interface ResponsiveNavProps {
  categories?: string[];
  activeTab?: string;
  onTabChange: (category: string) => void;
}

const ResponsiveNav: React.FC<ResponsiveNavProps> = ({
  categories = [],
  activeTab = '',
  onTabChange
}) => {
  const [overflowItems, setOverflowItems] = useState<string[]>([]);
  const [visibleItems, setVisibleItems] = useState<string[]>(categories);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updateVisibleItems = useCallback(() => {
    if (!navRef.current || !containerRef.current || !categories.length) return;

    const OVERFLOW_BUTTON_WIDTH = 120;
    const containerWidth = containerRef.current.offsetWidth - OVERFLOW_BUTTON_WIDTH;
    const nav = navRef.current;
    let totalWidth = 0;
    const visible: string[] = [];
    const overflow: string[] = [];

    Array.from(nav.childNodes).forEach((child) => {
      if (child instanceof HTMLElement) {
        child.style.display = 'block';
      }
    });
    
    const BUTTON_PADDING = 8;
    categories.forEach((category, index) => {
      const button = nav.childNodes[index];
      if (button instanceof HTMLElement) {
        const buttonWidth = button.offsetWidth + BUTTON_PADDING;
        if (totalWidth + buttonWidth < containerWidth) {
          visible.push(category);
          totalWidth += buttonWidth;
        } else {
          overflow.push(category);
        }
      }
    });

    setVisibleItems(visible);
    setOverflowItems(overflow);
  },[categories]);

  useEffect(() => {
    updateVisibleItems();
  }, [updateVisibleItems]);

  useEffect(() => {
    const handleResize = () => {
      updateVisibleItems();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateVisibleItems]);


  if (!categories.length) {
    return null;
  }

  return (
    <div className="relative bg-white shadow sticky top-16 z-40" ref={containerRef}>
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          <div className="flex-1 flex items-center gap-2 overflow-hidden" ref={navRef}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  onTabChange(category);
                  setIsOverflowOpen(false);
                }}
                style={{ display: visibleItems.includes(category) ? 'block' : 'none' }}
                className={`px-4 py-2 rounded-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  activeTab === category
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {overflowItems.length > 0 && (
            <div className="relative ml-2">
              <button
                onClick={() => setIsOverflowOpen(!isOverflowOpen)}
                className={`flex items-center px-3 py-2 rounded-sm font-medium transition-colors duration-200 
                  ${isOverflowOpen ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <MoreHorizontal className="w-5 h-5" />
                <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 
                  ${isOverflowOpen ? 'rotate-180' : ''}`} />
              </button>

              {isOverflowOpen && (
                <div className="absolute right-0 mt-2 py-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  {overflowItems.map((category) => (
                    <button
                      key={category}
                      onClick={() => {
                        onTabChange(category);
                        setIsOverflowOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors duration-200
                        ${activeTab === category
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponsiveNav;

