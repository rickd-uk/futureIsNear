"use client";

import React, { useState, useEffect, useRef } from "react";

interface Category {
  name: string;
  icon: string;
}

interface UserSubmitLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserSubmitLinkModal({
  isOpen,
  onClose,
  onSuccess,
}: UserSubmitLinkModalProps) {
  const today = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "",
    description: "",
    author: "",
    publicationDate: today,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedAuthor, setSuggestedAuthor] = useState("");
  const [pasteHint, setPasteHint] = useState<"url" | "title" | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      loadUserPreference();
    }
  }, [isOpen]);

  const fetchCategories = async () => {
    try {
      // Get public categories with icons
      const response = await fetch("/api/categories?withIcons=true");
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  const loadUserPreference = () => {
    const pref = localStorage.getItem("user_links_public_default");
    setMakePublic(pref === "true");
  };

  const fetchTitle = async (url: string) => {
    setSuggestedTitle("");
    setFetchingTitle(true);
    // Suggest domain as author
    try {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      setSuggestedAuthor((prev) => prev || domain);
    } catch { /* ignore */ }
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
      }
    } catch {
      // silently fail
    } finally {
      setFetchingTitle(false);
    }
  };

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

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("user_token");

      if (!formData.category) {
        throw new Error("Please select a category");
      }

      const pubDate = formData.publicationDate ? new Date(formData.publicationDate) : null;
      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          url: formData.url,
          category: formData.category,
          description: formData.description,
          author: formData.author || undefined,
          publicationDay: pubDate ? pubDate.getUTCDate() : null,
          publicationMonth: pubDate ? pubDate.getUTCMonth() + 1 : null,
          publicationYear: pubDate ? pubDate.getUTCFullYear() : null,
          makePublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit link");
      }

      // Reset form
      setFormData({ title: "", url: "", category: "", description: "", author: "", publicationDate: today });
      setSuggestedTitle(""); setSuggestedAuthor("");
      onSuccess();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to add link");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDefaultPreferenceChange = (checked: boolean) => {
    setMakePublic(checked);
    localStorage.setItem("user_links_public_default", String(checked));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add a Link</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* Row 1: Title + paste/clear */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <input
                ref={titleInputRef}
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={fetchingTitle ? "Fetching title..." : "Title *"}
              />
              <button
                type="button"
                onClick={async () => {
                  if (formData.title) {
                    setFormData((prev) => ({ ...prev, title: "" }));
                    setSuggestedTitle("");
                  } else {
                    const text = await readClipboard("title", titleInputRef);
                    if (text) setFormData((prev) => ({ ...prev, title: text }));
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0"
              >
                {formData.title ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                )}
              </button>
            </div>
            {pasteHint === "title" && (
              <p className="text-xs text-amber-600 px-1">Clipboard unavailable — press Ctrl+V to paste</p>
            )}
            {suggestedTitle && (
              <button
                type="button"
                onClick={() => { setFormData((prev) => ({ ...prev, title: suggestedTitle })); setSuggestedTitle(""); }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left truncate w-full px-1"
              >
                ↑ Use: {suggestedTitle}
              </button>
            )}
          </div>

          {/* Row 2: URL + paste/clear */}
          <div className="space-y-1">
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
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL *  https://..."
              />
              <button
                type="button"
                onClick={async () => {
                  if (formData.url) {
                    setFormData((prev) => ({ ...prev, url: "" }));
                    setSuggestedTitle("");
                    setSuggestedAuthor("");
                  } else {
                    const text = await readClipboard("url", urlInputRef);
                    if (text) {
                      setFormData((prev) => ({ ...prev, url: text }));
                      if (text.startsWith("http")) fetchTitle(text);
                    }
                  }
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex-shrink-0"
              >
                {formData.url ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                )}
              </button>
            </div>
            {pasteHint === "url" && (
              <p className="text-xs text-amber-600 px-1">Clipboard unavailable — press Ctrl+V to paste</p>
            )}
          </div>

          {/* Row 3: Category + Author side by side */}
          <div className="flex gap-2">
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Category *</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
            <div className="flex-1 space-y-1">
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Author (optional)"
              />
              {suggestedAuthor && !formData.author && (
                <button
                  type="button"
                  onClick={() => { setFormData((prev) => ({ ...prev, author: suggestedAuthor })); setSuggestedAuthor(""); }}
                  className="text-xs text-blue-600 hover:text-blue-800 text-left px-1"
                >
                  ↑ Use: {suggestedAuthor}
                </button>
              )}
            </div>
          </div>

          {/* Row 4: Description (compact) */}
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Description (optional)"
          />

          {/* Row 5: Publication date + Make public toggle — wraps on narrow screens */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-gray-500 whitespace-nowrap">Pub date</label>
              <input
                type="date"
                name="publicationDate"
                value={formData.publicationDate}
                onChange={handleInputChange}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm text-gray-700">Make public</span>
              <button
                type="button"
                onClick={() => handleDefaultPreferenceChange(!makePublic)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  makePublic ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    makePublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Row 6: Error */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Row 7: Cancel + Add */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {isSubmitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
