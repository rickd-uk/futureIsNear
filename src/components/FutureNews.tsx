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

const CATEGORY_ICONS: Record<string, string> = {
  All: "🌐",
  Technology: "💻",
  Health: "🏥",
  Science: "🔬",
  Business: "💼",
  Politics: "🏛️",
  Environment: "🌱",
  Sports: "⚽",
  Entertainment: "🎬",
  Education: "📚",
  Finance: "💰",
  AI: "🤖",
  Space: "🚀",
  Energy: "⚡",
  Climate: "🌍",
  Food: "🍽️",
  Travel: "✈️",
  Culture: "🎭",
  Conflict: "⚔️",
  Gaming: "🎮",
  Music: "🎵",
  Fashion: "👗",
  Auto: "🚗",
  "Real Estate": "🏠",
  Crypto: "₿",
  Legal: "⚖️",
  Security: "🔒",
  Social: "👥",
  Retail: "🛒",
  Media: "📺",
  Wellness: "🧘",
  Architecture: "🏗️",
};

export default function FutureNews() {
  const { isAuthenticated } = useAuth();
  const { remainingBudget, vote, removeVote, getVoteCount } =
    useVoting(isAuthenticated);

  const [allStories, setAllStories] = useState<Story[]>([]);
  const [filteredStories, setFilteredStories] = useState<Story[]>([]);
  const [displayedStories, setDisplayedStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInDescription, setSearchInDescription] = useState(true);
  const [searchInCategory, setSearchInCategory] = useState(true);
  const [searchInAuthor, setSearchInAuthor] = useState(true);

  const [sortMode, setSortMode] = useState<"hot" | "newest">("hot");

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

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
        // Add dummy categories for testing (remove in production)
        const dummyCategories = ["Gaming", "Music", "Fashion", "Auto", "Real Estate", "Crypto", "Legal", "Security", "Social", "Retail", "Media", "Wellness", "Architecture"];
        const allCats = [...new Set([...uniqueCategories, ...dummyCategories])].sort();
        setCategories(["All", ...allCats]);
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

  useEffect(() => {
    let result = allStories;
    if (selectedCategory !== "All") {
      result = result.filter((story) => story.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((story) => {
        const matches: boolean[] = [];
        if (searchInTitle) matches.push(story.title.toLowerCase().includes(query));
        if (searchInDescription) matches.push(story.description?.toLowerCase().includes(query) || false);
        if (searchInAuthor) matches.push(story.author?.toLowerCase().includes(query) || false);
        if (searchInCategory) matches.push(story.category.toLowerCase().includes(query));
        return matches.some(Boolean);
      });
    }
    setFilteredStories(result);
    setPage(1);
    setDisplayedStories(result.slice(0, STORIES_PER_PAGE));
    setHasMore(result.length > STORIES_PER_PAGE);
  }, [allStories, selectedCategory, searchQuery, searchInTitle, searchInDescription, searchInAuthor, searchInCategory]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const end = nextPage * STORIES_PER_PAGE;
    setDisplayedStories(filteredStories.slice(0, end));
    setPage(nextPage);
    setHasMore(end < filteredStories.length);
    setLoadingMore(false);
  }, [page, filteredStories, loadingMore, hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loadingMore]);

  const CategoryButton = ({ cat, compact = false }: { cat: string; compact?: boolean }) => {
    const icon = CATEGORY_ICONS[cat] || "📁";
    const isActive = selectedCategory === cat;
    return (
      <button
        onClick={() => {
          setSelectedCategory(cat);
          setShowMobileMenu(false);
        }}
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
          isActive
            ? "bg-blue-600 text-white"
            : "hover:bg-gray-100 text-gray-700"
        }`}
        title={cat}
      >
        <span className="text-base">{icon}</span>
        {!compact && <span className="text-sm">{cat}</span>}
        {compact && <span className="text-xs">{cat.slice(0, 4)}</span>}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Logo and User only */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span>FutureIsNear</span>
          </h1>
          <UserMenu remainingBudget={remainingBudget} />
        </div>
      </header>

      {/* Categories Row - Sort toggle | separator | categories | burger */}
      <div className="bg-white border-b border-gray-200 sticky top-[52px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            {/* Sort Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-gray-300 flex-shrink-0">
              <button
                onClick={() => setSortMode("hot")}
                className={`px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  sortMode === "hot"
                    ? "bg-orange-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                🔥 Hot
              </button>
              <button
                onClick={() => setSortMode("newest")}
                className={`px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  sortMode === "newest"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                ✨ New
              </button>
            </div>

            {/* Separator */}
            <div className="w-px h-8 bg-gray-300 flex-shrink-0" />

            {/* Categories - responsive: show more on larger screens */}
            <div className="flex-1 flex items-center gap-1 overflow-hidden">
              {/* Extra small: 3 categories */}
              <div className="flex sm:hidden items-center gap-1">
                {categories.slice(0, 3).map((cat) => (
                  <CategoryButton key={cat} cat={cat} compact />
                ))}
              </div>
              {/* Small: 5 categories */}
              <div className="hidden sm:flex md:hidden items-center gap-1">
                {categories.slice(0, 5).map((cat) => (
                  <CategoryButton key={cat} cat={cat} />
                ))}
              </div>
              {/* Medium: 8 categories */}
              <div className="hidden md:flex lg:hidden items-center gap-1">
                {categories.slice(0, 8).map((cat) => (
                  <CategoryButton key={cat} cat={cat} />
                ))}
              </div>
              {/* Large: 12 categories */}
              <div className="hidden lg:flex xl:hidden items-center gap-1">
                {categories.slice(0, 12).map((cat) => (
                  <CategoryButton key={cat} cat={cat} />
                ))}
              </div>
              {/* Extra large: 16 categories */}
              <div className="hidden xl:flex items-center gap-1">
                {categories.slice(0, 16).map((cat) => (
                  <CategoryButton key={cat} cat={cat} />
                ))}
              </div>
            </div>

            {/* More button - shows when there are more categories than displayed */}
            {categories.length > 3 && (
              <button
                onClick={() => setShowMobileMenu(true)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 flex-shrink-0 border border-gray-300"
                title="More categories"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm hidden sm:inline">More</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Slide-in Menu */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">All Categories</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-2">
              {categories.map((cat) => {
                const icon = CATEGORY_ICONS[cat] || "📁";
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-sm font-medium">{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Search Row */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2 max-w-xl">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stories..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`p-2 rounded-lg border transition-colors ${
                showAdvanced
                  ? "bg-blue-100 border-blue-300 text-blue-700"
                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
              }`}
              title="Advanced search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search Panel */}
      {showAdvanced && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-800">
              <span className="text-gray-600 font-medium">Search in:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={searchInTitle} onChange={(e) => setSearchInTitle(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">Title</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={searchInDescription} onChange={(e) => setSearchInDescription(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">Description</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={searchInAuthor} onChange={(e) => setSearchInAuthor(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">Author</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={searchInCategory} onChange={(e) => setSearchInCategory(e.target.checked)} className="rounded text-blue-600" />
                <span className="text-gray-700">Category</span>
              </label>
            </div>
          </div>
        </div>
      )}

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
                  <article key={story.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <VoteButton
                        storyId={story.id}
                        totalVotes={story.totalVotes}
                        userVoteCount={userVoteCount}
                        isAuthenticated={isAuthenticated}
                        remainingBudget={remainingBudget}
                        onVote={vote}
                        onRemoveVote={removeVote}
                      />
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
                          <p className="text-gray-600 text-xs mb-1 line-clamp-1">{story.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{story.author || "Unknown"}</span>
                          <PublicationDate month={story.publicationMonth} year={story.publicationYear} className="flex items-center gap-1" />
                        </div>
                      </div>
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
