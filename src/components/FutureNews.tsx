// src/components/FutureNews.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import PublicationDate from "./PublicationDate";
import UserMenu from "./UserMenu";
import VoteButton from "./VoteButton";
import { useAuth } from "@/hooks/useAuth";
import { useVoting } from "@/hooks/useVoting";

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
  totalVotes: number;
  hotScore: number;
  boost: number;
}

export default function FutureNews() {
  const { isAuthenticated } = useAuth();
  const {
    remainingBudget,
    vote,
    removeVote,
    getVoteCount,
  } = useVoting(isAuthenticated);

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [categoryFilteredStories, setCategoryFilteredStories] = useState<
    Story[]
  >([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

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

  // Sort states
  const [sortMode, setSortMode] = useState<"hot" | "newest">("hot");

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories?sort=${sortMode}`);
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
  }, [sortMode]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

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
  ]);

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 p-2 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-white">FutureIsNear</h1>
          <UserMenu remainingBudget={remainingBudget} />
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
                <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                  <button
                    onClick={() => setSortMode("hot")}
                    title="Sort by hot score"
                    className={`px-2 py-1 text-xs transition-colors ${
                      sortMode === "hot"
                        ? "bg-orange-500 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    Hot
                  </button>
                  <button
                    onClick={() => setSortMode("newest")}
                    title="Sort by newest"
                    className={`px-2 py-1 text-xs transition-colors ${
                      sortMode === "newest"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    New
                  </button>
                </div>
              </div>

              {/* Results Count */}
              <div className="ml-auto text-xs text-gray-600">
                {searchQuery ? (
                  filteredStories.length > 0 ? (
                    <span>
                      <strong>{filteredStories.length}</strong> result
                      {filteredStories.length !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-red-600">No results</span>
                  )
                ) : (
                  <span>
                    <strong>{categoryFilteredStories.length}</strong> in{" "}
                    {activeTab}
                  </span>
                )}
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
                const userVoteCount = getVoteCount(story.id);
                return (
                  <article
                    key={story.id}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      {/* Vote Button */}
                      <VoteButton
                        storyId={story.id}
                        totalVotes={story.totalVotes}
                        userVoteCount={userVoteCount}
                        isAuthenticated={isAuthenticated}
                        remainingBudget={remainingBudget}
                        onVote={vote}
                        onRemoveVote={removeVote}
                      />

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
