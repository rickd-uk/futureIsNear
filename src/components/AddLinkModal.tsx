// src/components/AddLinkModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { suggestCategory } from "@/lib/suggestCategory";

interface AddLinkModalProps {
  isOpen: boolean;
  categories: { name: string; icon: string }[];
  authors: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddLinkModal({
  isOpen,
  categories,
  authors,
  onClose,
  onSuccess,
}: AddLinkModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "",
    description: "",
    author: "",
    publicationDate: today,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedAuthor, setSuggestedAuthor] = useState("");
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [suggestedDescription, setSuggestedDescription] = useState("");
  const [fetchedDescription, setFetchedDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [pasteHint, setPasteHint] = useState<"url" | "title" | null>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const readClipboard = async (field: "url" | "title", fallbackRef?: React.RefObject<HTMLInputElement | null>): Promise<string> => {
    try {
      const text = await (navigator.clipboard?.readText() ?? Promise.reject());
      return text ?? "";
    } catch {
      fallbackRef?.current?.focus();
      setPasteHint(field);
      setTimeout(() => setPasteHint(null), 3000);
      return "";
    }
  };

  const fetchTitle = async (url: string) => {
    setSuggestedTitle("");
    setFetchingTitle(true);
    let domain = "";
    try { domain = new URL(url).hostname.replace(/^www\./, ""); } catch { /* ignore */ }
    try {
      const res = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.title) {
          const looksLikeDomain = !data.title.includes(" ") && data.title.includes(".");
          if (!looksLikeDomain) {
            setFormData((prev) => prev.title ? prev : { ...prev, title: data.title });
            setSuggestedTitle((prev) => prev || data.title);
          }
        }
        const authorHint = data.author || domain;
        if (authorHint) setSuggestedAuthor((prev) => prev || authorHint);
        if (data.description) setFetchedDescription(data.description);
      } else if (domain) {
        setSuggestedAuthor((prev) => prev || domain);
      }
    } catch { if (domain) setSuggestedAuthor((prev) => prev || domain); }
    finally { setFetchingTitle(false); }
  };

  const runAiLookup = async () => {
    if (!formData.url) return;
    setAiLoading(true);
    setAiError("");
    try {
      const token = localStorage.getItem("admin_token");
      const res = await fetch("/api/ai-lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: formData.url,
          title: suggestedTitle || formData.title || undefined,
          description: fetchedDescription || undefined,
          author: suggestedAuthor || formData.author || undefined,
          categories: categories.map((c) => c.name),
        }),
      });
      if (!res.ok) throw new Error("AI lookup failed");
      const data = await res.json();
      if (data.title) setSuggestedTitle((prev) => prev || data.title);
      if (data.author) setSuggestedAuthor((prev) => prev || data.author);
      if (data.category) setSuggestedCategory(data.category);
      if (data.description) setSuggestedDescription(data.description);
    } catch {
      setAiError("AI lookup failed. Try again.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (formData.category) { setSuggestedCategory(""); return; }
    if (!formData.url && !formData.title) return;
    const s = suggestCategory(formData.url, formData.title, categories);
    setSuggestedCategory(s ?? "");
  }, [formData.url, formData.title, formData.category, categories]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "author") {
      setShowAuthorSuggestions(true);
    }
  };

  const selectAuthor = (authorName: string) => {
    setFormData((prev) => ({ ...prev, author: authorName }));
    setShowAuthorSuggestions(false);
  };

  const filteredAuthors =
    formData.author.length === 0
      ? authors
      : authors.filter((author) =>
          author.toLowerCase().includes(formData.author.toLowerCase()),
        );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.title.trim() ||
      !formData.url.trim() ||
      !formData.category.trim()
    ) {
      setError("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          url: formData.url.trim(),
          category: formData.category.trim(),
          description: formData.description.trim() || undefined,
          author: formData.author.trim() || undefined,
          ...(formData.publicationDate ? (() => { const d = new Date(formData.publicationDate); return { publicationDay: d.getUTCDate(), publicationMonth: d.getUTCMonth() + 1, publicationYear: d.getUTCFullYear() }; })() : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create link");
      }

      setFormData({
        title: "",
        url: "",
        category: "",
        description: "",
        author: "",
        publicationDate: today,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create link");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add New Link</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            type="button"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={titleInputRef}
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder={fetchingTitle ? "Fetching title..." : ""}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button type="button" onClick={async () => {
                if (formData.title) { setFormData((p) => ({ ...p, title: "" })); setSuggestedTitle(""); }
                else { const t = await readClipboard("title", titleInputRef); if (t) setFormData((p) => ({ ...p, title: t })); }
              }} className="px-3 py-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-50 flex-shrink-0">
                {formData.title ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              </button>
            </div>
            {pasteHint === "title" && (
              <p className="text-xs text-amber-600 px-1 mt-1">Clipboard unavailable — press Ctrl+V to paste</p>
            )}
            {suggestedTitle && (
              <button type="button" onClick={() => { setFormData((p) => ({ ...p, title: suggestedTitle })); setSuggestedTitle(""); }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left truncate w-full px-1 mt-1">
                ↑ Use: {suggestedTitle}
              </button>
            )}
          </div>

          {/* URL */}
          <div>
            <label
              htmlFor="url"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              URL <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                ref={urlInputRef}
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                onPaste={(e) => {
                  const text = e.clipboardData?.getData("text") ?? "";
                  if (text.startsWith("http")) setTimeout(() => fetchTitle(text), 0);
                }}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                type="button"
                onClick={runAiLookup}
                disabled={!formData.url || aiLoading}
                title="AI fill"
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-purple-600 hover:bg-purple-50 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {aiLoading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <span>✨</span>
                )}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (formData.url) {
                    setFormData((prev) => ({ ...prev, url: "" }));
                    setSuggestedTitle(""); setSuggestedAuthor(""); setSuggestedDescription(""); setFetchedDescription(""); setAiError("");
                  } else {
                    const text = await readClipboard("url", urlInputRef);
                    if (text) {
                      setFormData((prev) => ({ ...prev, url: text }));
                      if (text.startsWith("http")) fetchTitle(text);
                    }
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0"
              >
                {formData.url ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                )}
              </button>
            </div>
            {pasteHint === "url" && (
              <p className="text-xs text-amber-600 mt-1">Clipboard unavailable — press Ctrl+V to paste</p>
            )}
            {aiError && (
              <p className="text-xs text-red-600 mt-1">{aiError}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const selected = formData.category === cat.name;
                const suggested = !formData.category && suggestedCategory === cat.name;
                return (
                  <button key={cat.name} type="button"
                    onClick={() => { setFormData((p) => ({ ...p, category: selected ? "" : cat.name })); setSuggestedCategory(""); }}
                    className={`shrink-0 text-xs px-2.5 py-1.5 rounded-full border transition-colors whitespace-nowrap ${
                      selected ? "bg-blue-600 text-white border-blue-600"
                      : suggested ? "bg-blue-50 border-blue-400 text-blue-700 border-dashed"
                      : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-100"
                    }`}>
                    {cat.icon} {cat.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Publication Date */}
          <div>
            <label htmlFor="publicationDate" className="block text-sm font-medium text-gray-700 mb-1">
              Publication Date
            </label>
            <input
              type="date"
              id="publicationDate"
              name="publicationDate"
              value={formData.publicationDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-y"
            />
            {suggestedDescription && (
              <button type="button"
                onClick={() => { setFormData((p) => ({ ...p, description: suggestedDescription })); setSuggestedDescription(""); }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left w-full px-1 mt-1 line-clamp-2">
                ↑ Use: {suggestedDescription}
              </button>
            )}
          </div>

          {/* Author with partial search */}
          <div className="relative">
            <label
              htmlFor="author"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Author
            </label>
            <input
              ref={authorInputRef}
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleInputChange}
              onFocus={() => setShowAuthorSuggestions(true)}
              onBlur={() =>
                setTimeout(() => setShowAuthorSuggestions(false), 150)
              }
              autoComplete="off"
              placeholder="Type to search authors..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {suggestedAuthor && !formData.author && (
              <button type="button" onClick={() => { setFormData((p) => ({ ...p, author: suggestedAuthor })); setSuggestedAuthor(""); }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left px-1 mt-1 block">
                ↑ Use: {suggestedAuthor}
              </button>
            )}
            {showAuthorSuggestions && filteredAuthors.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredAuthors.slice(0, 10).map((author, index) => {
                  const query = formData.author.toLowerCase();
                  const idx =
                    query.length > 0 ? author.toLowerCase().indexOf(query) : -1;
                  return (
                    <button
                      key={index}
                      type="button"
                      onMouseDown={() => selectAuthor(author)}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 text-gray-900 text-sm border-b border-gray-100 last:border-0"
                    >
                      {idx >= 0 ? (
                        <>
                          {author.slice(0, idx)}
                          <span className="font-semibold text-blue-600">
                            {author.slice(idx, idx + formData.author.length)}
                          </span>
                          {author.slice(idx + formData.author.length)}
                        </>
                      ) : (
                        author
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding Link..." : "Add Link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
