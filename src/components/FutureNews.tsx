// src/components/FutureNews.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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

const STORIES_PER_PAGE = 20;

export default function FutureNews() {
  const { isAuthenticated } = useAuth();
  const { remainingBudget, vote, removeVote, getVoteCount } =
    useVoting(isAuthenticated);

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [displayedStories, setDisplayedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Category state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Sort state
  const [sortMode, setSortMode] = useState<"hot" | "newest">("hot");

  // Infinite scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  // Fetch stories
  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/stories?sort=${sortMode}`);
      if (response.ok) {
        const data = await response.json();
        setAllStories(data);

        const uniqueCategories = Array.from(
          new Set(data.map((s: Story) => s.category))
        ) as string[];
        setCategories(["All", ...uniqueCategories.sort()]);
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

  // Filter stories by category and search
  useEffect(() => {
    let result = allStories;

    // Filter by category
    if (selectedCategory !== "All") {
      result = result.filter((story) => story.category === selectedCategory);
    }

    // Filter by search (searches title, description, author, category)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (story) =>
          story.title.toLowerCase().includes(query) ||
          story.description?.toLowerCase().includes(query) ||
          story.author?.toLowerCase().includes(query) ||
          story.category.toLowerCase().includes(query)
      );
    }

    setFilteredStories(result);
    setPage(1);
    setDisplayedStories(result.slice(0, STORIES_PER_PAGE));
    setHasMore(result.length > STORIES_PER_PAGE);
  }, [allStories, selectedCategory, searchQuery]);

  // Load more stories
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const start = 0;
    const end = nextPage * STORIES_PER_PAGE;
    const newDisplayed = filteredStories.slice(start, end);

    setDisplayedStories(newDisplayed);
    setPage(nextPage);
    setHasMore(end < filteredStories.length);
    setLoadingMore(false);
  }, [page, filteredStories, loadingMore, hasMore]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center gap-3">
          {/* Logo */}
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="hidden sm:inline">FutureIsNear</span>
          </h1>

          {/* Sort Dropdown */}
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as "hot" | "newest")}
            className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="hot" className="text-gray-900">🔥 Hot</option>
            <option value="newest" className="text-gray-900">✨ New</option>
          </select>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white/20 text-white border border-white/30 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-white/50 max-w-[150px]"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat} className="text-gray-900">
                {cat}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[150px] max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full bg-white/20 text-white placeholder-white/70 border border-white/30 rounded-lg pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
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

          {/* User Menu */}
          <div className="ml-auto">
            <UserMenu remainingBudget={remainingBudget} />
          </div>
        </div>
      </header>

      {/* Results count */}
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm text-gray-500">
        {filteredStories.length} stories
        {selectedCategory !== "All" && ` in ${selectedCategory}`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Stories */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading stories...
          </div>
        ) : displayedStories.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No stories found.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {displayedStories.map((story) => {
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

                        {story.description && (
                          <p className="text-gray-600 text-xs mb-1 line-clamp-1">
                            {story.description}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{story.author || "Unknown"}</span>
                          <PublicationDate
                            month={story.publicationMonth}
                            year={story.publicationYear}
                            className="flex items-center gap-1"
                          />
                        </div>
                      </div>

                      {/* External Link */}
                      <a
                        href={story.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 text-gray-400 hover:text-blue-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Infinite scroll loader */}
            {hasMore && (
              <div ref={loaderRef} className="p-4 text-center text-gray-500 text-sm">
                {loadingMore ? "Loading more..." : "Scroll for more"}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
