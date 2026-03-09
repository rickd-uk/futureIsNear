// src/components/FutureNews.tsx
"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import PublicationDate from "./PublicationDate";
import UserMenu from "./UserMenu";
import VoteButton from "./VoteButton";
import UserSubmitLinkModal from "./UserSubmitLinkModal";
import { useAuth } from "@/hooks/useAuth";
import { useVoting } from "@/hooks/useVoting";

interface Link {
  id: string;
  title: string;
  url: string;
  category: string;
  author: string | null;
  description: string | null;
  publicationDay?: number | null;
  publicationMonth?: number | null;
  publicationYear?: number | null;
  timestamp: string;
  totalVotes: number;
  hotScore: number;
  boost: number;
  isPublic: boolean;
  createdById: string | null;
  submittedBy: string | null;
}

const LINKS_PER_PAGE = 20;

export default function FutureNews() {
  const { isAuthenticated, user } = useAuth();
  const { remainingBudget, vote, removeVote, getVoteCount } =
    useVoting(isAuthenticated);

  const [allLinks, setAllLinks] = useState<Link[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [displayedLinks, setDisplayedLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [categoryIcons, setCategoryIcons] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const [searchQuery, setSearchQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchInTitle, setSearchInTitle] = useState(true);
  const [searchInDescription, setSearchInDescription] = useState(true);
  const [searchInCategory, setSearchInCategory] = useState(true);
  const [searchInAuthor, setSearchInAuthor] = useState(true);

  const [sortMode, setSortMode] = useState<"hot" | "newest">("hot");

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("user_token");
      const headers: HeadersInit = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      // Fetch links and categories with icons in parallel
      const [linksRes, categoriesRes] = await Promise.all([
        fetch(`/api/links?sort=${sortMode}`, { headers }),
        fetch("/api/categories?withIcons=true"),
      ]);

      let linkData: Link[] = [];
      if (linksRes.ok) {
        linkData = await linksRes.json();
        setAllLinks(linkData);
      }

      if (categoriesRes.ok) {
        const catData = await categoriesRes.json();
        const icons: Record<string, string> = { All: "🌐" };
        catData.forEach((c: { name: string; icon: string }) => {
          icons[c.name] = c.icon;
        });
        setCategoryIcons(icons);
        const categoriesWithLinks = new Set(linkData.map((s) => s.category));
        setCategories([
          "All",
          ...catData
            .map((c: { name: string }) => c.name)
            .filter((name: string) => categoriesWithLinks.has(name))
            .sort(),
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch links:", error);
    } finally {
      setLoading(false);
    }
  }, [sortMode]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    let result = allLinks;
    if (selectedCategory !== "All") {
      result = result.filter((link) => link.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((link) => {
        const matches: boolean[] = [];
        if (searchInTitle) matches.push(link.title.toLowerCase().includes(query));
        if (searchInDescription) matches.push(link.description?.toLowerCase().includes(query) || false);
        if (searchInAuthor) matches.push(link.author?.toLowerCase().includes(query) || false);
        if (searchInCategory) matches.push(link.category.toLowerCase().includes(query));
        return matches.some(Boolean);
      });
    }
    setFilteredLinks(result);
    setPage(1);
    setDisplayedLinks(result.slice(0, LINKS_PER_PAGE));
    setHasMore(result.length > LINKS_PER_PAGE);
  }, [allLinks, selectedCategory, searchQuery, searchInTitle, searchInDescription, searchInAuthor, searchInCategory]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const end = nextPage * LINKS_PER_PAGE;
    setDisplayedLinks(filteredLinks.slice(0, end));
    setPage(nextPage);
    setHasMore(end < filteredLinks.length);
    setLoadingMore(false);
  }, [page, filteredLinks, loadingMore, hasMore]);

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

  const toggleVisibility = async (linkId: string, makePublic: boolean) => {
    try {
      const token = localStorage.getItem("user_token");
      const response = await fetch(`/api/links/${linkId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: makePublic }),
      });

      if (response.ok) {
        // Update local state
        setAllLinks((prev) =>
          prev.map((s) =>
            s.id === linkId ? { ...s, isPublic: makePublic } : s
          )
        );
      }
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  const CategoryButton = ({ cat }: { cat: string }) => {
    const icon = categoryIcons[cat] || "📁";
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
        <span className="text-sm hidden sm:inline">{cat}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      {/* Header - Logo and User only */}
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-3 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            <span>LinX</span>
          </h1>
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Link
              </button>
            )}
            <UserMenu remainingBudget={remainingBudget} />
          </div>
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

            {/* Categories - scrollable row, icon-only on mobile */}
            <div className="flex-1 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              <div className="flex items-center gap-1 w-max">
                {categories.map((cat) => (
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
                const icon = categoryIcons[cat] || "📁";
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
                placeholder="Search links..."
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        {filteredLinks.length} links
        {selectedCategory !== "All" && ` in ${selectedCategory}`}
        {searchQuery && ` matching "${searchQuery}"`}
      </div>

      {/* Links */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            Loading links...
          </div>
        ) : displayedLinks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            No links found.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {displayedLinks.map((link) => {
                const userVoteCount = getVoteCount(link.id);
                return (
                  <article key={link.id} className="p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <VoteButton
                        linkId={link.id}
                        totalVotes={link.totalVotes}
                        userVoteCount={userVoteCount}
                        isAuthenticated={isAuthenticated}
                        remainingBudget={remainingBudget}
                        onVote={vote}
                        onRemoveVote={removeVote}
                      />
                      <div className="flex-1 min-w-0 select-text">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="inline-block px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded select-none">
                            {link.category}
                          </span>
                          {/* Private badge for user's own private links */}
                          {!link.isPublic && link.createdById === user?.id && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              Private
                            </span>
                          )}
                          <h2 className="text-sm font-semibold text-gray-900 flex-1">
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600 transition-colors"
                            >
                              {link.title}
                            </a>
                          </h2>
                        </div>
                        {link.description && (
                          <p className="text-gray-600 text-xs mb-1 line-clamp-1">{link.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{link.author || "Unknown"}</span>
                          <PublicationDate day={link.publicationDay} month={link.publicationMonth} year={link.publicationYear} className="flex items-center gap-1" />
                          <span title="Added to LinX">🔗 {new Date(link.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                          {/* Show submitter for user-created links */}
                          {link.submittedBy && (
                            <span className="text-gray-400">by {link.submittedBy}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {/* Toggle visibility button for user's own private links */}
                        {link.createdById === user?.id && !link.isPublic && (
                          <button
                            onClick={() => toggleVisibility(link.id, true)}
                            className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Make this link public"
                          >
                            Make Public
                          </button>
                        )}
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
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

      {/* Submit Link Modal */}
      <UserSubmitLinkModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          fetchLinks();
        }}
      />
    </div>
  );
}
