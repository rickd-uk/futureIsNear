// src/components/FutureNews.tsx
"use client";

import React, { useState, useEffect } from "react";
import PublicationDate from "./PublicationDate";

interface Story {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string | null;
  description: string | null;
  publicationMonth?: number | null;
  publicationYear?: number | null;
  timestamp: string;
}

export default function FutureNews() {
  const [allStories, setAllStories] = useState<Story[]>([]);
  const [categoryFilteredStories, setCategoryFilteredStories] = useState<
    Story[]
  >([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Category/Tab states
  const [categories, setCategories] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("All");

  // Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInDescription, setSearchInDescription] = useState(true);
  const [searchInCategory, setSearchInCategory] = useState(false);
  const [searchInAuthor, setSearchInAuthor] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWords, setWholeWords] = useState(false);

  // Favorites filter
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  // Sort states
  const [sortField, setSortField] = useState<"date" | "title">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchStories();
    fetchFavorites();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stories");
      if (response.ok) {
        const data = await response.json();
        setAllStories(data);

        // Extract unique categories and add "All" at the beginning
        const uniqueCategories = Array.from(
          new Set(data.map((s: Story) => s.category)),
        ) as string[];
        setCategories(["All", ...uniqueCategories.sort()]);

        // Initially show all stories
        setCategoryFilteredStories(data);
        setFilteredStories(data);
      }
    } catch (error) {
      console.error("Failed to fetch stories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    try {
      const response = await fetch("/api/favorites");
      if (response.ok) {
        const data = await response.json();
        setFavorites(new Set(data.favoriteIds));
      }
    } catch (error) {
      console.error("Failed to fetch favorites:", error);
    }
  };

  const toggleFavorite = async (storyId: string) => {
    const isFavorited = favorites.has(storyId);

    // Optimistic update
    const newFavorites = new Set(favorites);
    if (isFavorited) {
      newFavorites.delete(storyId);
    } else {
      newFavorites.add(storyId);
    }
    setFavorites(newFavorites);

    try {
      if (isFavorited) {
        await fetch(`/api/favorites?storyId=${storyId}`, {
          method: "DELETE",
        });
      } else {
        await fetch("/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ storyId }),
        });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      setFavorites(favorites);
    }
  };

  // Filter by category when active tab changes
  useEffect(() => {
    let filtered: Story[];

    if (activeTab === "All") {
      filtered = allStories;
    } else {
      filtered = allStories.filter((story) => story.category === activeTab);
    }

    setCategoryFilteredStories(filtered);
  }, [activeTab, allStories]);

  // Apply search filter on category-filtered stories
  useEffect(() => {
    let result = categoryFilteredStories;

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter((story) => {
        const fieldsToSearch: string[] = [];

        if (searchInTitle && story.title) {
          fieldsToSearch.push(story.title);
        }

        if (searchInDescription && story.description) {
          fieldsToSearch.push(story.description);
        }

        if (searchInCategory && story.category) {
          fieldsToSearch.push(story.category);
        }

        if (searchInAuthor && story.author) {
          fieldsToSearch.push(story.author);
        }

        if (fieldsToSearch.length === 0) {
          return false;
        }

        let pattern: RegExp;

        if (wholeWords) {
          const escapedQuery = searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          const regexFlags = caseSensitive ? "g" : "gi";
          pattern = new RegExp(`\\b${escapedQuery}\\b`, regexFlags);
        } else {
          const regexFlags = caseSensitive ? "g" : "gi";
          const escapedQuery = searchQuery.replace(
            /[.*+?^${}()|[\]\\]/g,
            "\\$&",
          );
          pattern = new RegExp(escapedQuery, regexFlags);
        }

        return fieldsToSearch.some((field) => {
          if (wholeWords || !caseSensitive) {
            return pattern.test(field);
          } else {
            return field.includes(searchQuery);
          }
        });
      });
    }

    // Apply favorites filter
    if (showOnlyFavorites) {
      result = result.filter((story) => favorites.has(story.id));
    }

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.timestamp).getTime();
        const dateB = new Date(b.timestamp).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      } else {
        // Sort by title
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        if (sortDirection === "asc") {
          return titleA.localeCompare(titleB);
        } else {
          return titleB.localeCompare(titleA);
        }
      }
    });

    setFilteredStories(result);
  }, [
    searchQuery,
    searchInTitle,
    searchInDescription,
    searchInCategory,
    searchInAuthor,
    caseSensitive,
    wholeWords,
    categoryFilteredStories,
    showOnlyFavorites,
    favorites,
    sortField,
    sortDirection,
  ]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-xl font-bold text-white">FutureIsNear</h1>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white shadow sticky top-8 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-3 py-1 rounded text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                  activeTab === category
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Search Box */}
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm mb-4">
          <div className="space-y-3">
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${activeTab === "All" ? "all categories" : activeTab}...`}
                className="block w-full pl-10 pr-10 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  title="Clear search"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Search Options */}
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {/* Search Fields with Icons */}
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center cursor-pointer group"
                  title="Search in title"
                >
                  <input
                    type="checkbox"
                    checked={searchInTitle}
                    onChange={(e) => setSearchInTitle(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <svg
                    className="w-4 h-4 ml-1.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                </label>

                <label
                  className="flex items-center cursor-pointer group"
                  title="Search in description"
                >
                  <input
                    type="checkbox"
                    checked={searchInDescription}
                    onChange={(e) => setSearchInDescription(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <svg
                    className="w-4 h-4 ml-1.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </label>

                <label
                  className="flex items-center cursor-pointer group"
                  title="Search in category"
                >
                  <input
                    type="checkbox"
                    checked={searchInCategory}
                    onChange={(e) => setSearchInCategory(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <svg
                    className="w-4 h-4 ml-1.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </label>

                <label
                  className="flex items-center cursor-pointer group"
                  title="Search in author"
                >
                  <input
                    type="checkbox"
                    checked={searchInAuthor}
                    onChange={(e) => setSearchInAuthor(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <svg
                    className="w-4 h-4 ml-1.5 text-gray-600 group-hover:text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </label>
              </div>

              {/* Divider */}
              <div className="border-l border-gray-300 h-6"></div>

              {/* Search Options with Icons */}
              <div className="flex items-center gap-2">
                <label
                  className="flex items-center cursor-pointer group"
                  title="Case sensitive"
                >
                  <input
                    type="checkbox"
                    checked={caseSensitive}
                    onChange={(e) => setCaseSensitive(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-1.5 text-gray-600 group-hover:text-blue-600 font-mono text-xs">
                    Aa
                  </span>
                </label>

                <label
                  className="flex items-center cursor-pointer group"
                  title="Whole words only"
                >
                  <input
                    type="checkbox"
                    checked={wholeWords}
                    onChange={(e) => setWholeWords(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="ml-1.5 text-gray-600 group-hover:text-blue-600 font-mono text-xs">
                    |ab|
                  </span>
                </label>
              </div>

              {/* Divider */}
              <div className="border-l border-gray-300 h-6"></div>

              {/* Sort Controls */}
              <div className="flex items-center gap-1">
                {/* Sort Field Toggle */}
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setSortField("date")}
                    title="Sort by date"
                    className={`px-2 py-1 text-xs transition-colors ${
                      sortField === "date"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setSortField("title")}
                    title="Sort by title"
                    className={`px-2 py-1 text-xs transition-colors ${
                      sortField === "title"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Sort Direction Toggle */}
                <button
                  onClick={() =>
                    setSortDirection(sortDirection === "asc" ? "desc" : "asc")
                  }
                  title={
                    sortDirection === "asc"
                      ? "Ascending (oldest/A-Z first)"
                      : "Descending (newest/Z-A first)"
                  }
                  className="px-2 py-1 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  {sortDirection === "asc" ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="border-l border-gray-300 h-6"></div>

              {/* Favorites Filter */}
              <button
                onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                title="Show only favorites"
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  showOnlyFavorites
                    ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-400"
                    : "bg-gray-100 text-gray-700 border-2 border-transparent hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={showOnlyFavorites ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
                <span>Favorites</span>
              </button>

              {/* Results Count */}
              <div className="ml-auto text-xs text-gray-600">
                {searchQuery ? (
                  filteredStories.length > 0 ? (
                    <span>
                      <strong>{filteredStories.length}</strong> result
                      {filteredStories.length !== 1 ? "s" : ""}
                      {showOnlyFavorites && (
                        <span className="text-yellow-600"> ★</span>
                      )}
                    </span>
                  ) : (
                    <span className="text-red-600">No results</span>
                  )
                ) : (
                  <span>
                    <strong>{categoryFilteredStories.length}</strong> in{" "}
                    {activeTab}
                    {showOnlyFavorites && (
                      <>
                        {" "}
                        → <strong>{filteredStories.length}</strong> ★
                      </>
                    )}
                  </span>
                )}
                <span className="text-gray-400 ml-2">
                  {sortField === "date" ? "📅" : "🔤"}{" "}
                  {sortDirection === "asc" ? "↑" : "↓"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Stories Display */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
            Loading stories...
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500 text-sm">
            {searchQuery
              ? "No stories match your search."
              : "No stories found in this category."}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredStories.map((story) => {
                const isFavorited = favorites.has(story.id);
                return (
                  <article
                    key={story.id}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Favorite Star Button */}
                      <button
                        onClick={() => toggleFavorite(story.id)}
                        className="flex-shrink-0"
                        title={
                          isFavorited
                            ? "Remove from favorites"
                            : "Add to favorites"
                        }
                      >
                        {isFavorited ? (
                          <svg
                            className="w-5 h-5 text-yellow-400 hover:text-yellow-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ) : (
                          <svg
                            className="w-5 h-5 text-gray-300 hover:text-yellow-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                            />
                          </svg>
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Category */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            {story.category}
                          </span>
                          <h2 className="text-sm font-semibold text-gray-900 flex-1">
                            <a
                              href={story.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 transition-colors"
                            >
                              {story.title}
                            </a>
                          </h2>
                        </div>

                        {/* Description */}
                        {story.description && (
                          <p className="text-gray-600 text-xs mb-1 line-clamp-1">
                            {story.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                            {story.author || "Unknown"}
                          </span>
                          <PublicationDate
                            month={story.publicationMonth}
                            year={story.publicationYear}
                            className="flex items-center gap-1"
                          />
                          <span className="flex items-center gap-1">
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            {new Date(story.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* External Link Icon */}
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open in new tab"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
