// src/components/EditLinkModal.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";

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
  boost?: number;
}

interface EditLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  link: Link | null;
  categories: { name: string; icon: string }[];
  authors: string[];
}

export default function EditLinkModal({
  isOpen,
  onClose,
  onSuccess,
  link,
  categories,
  authors,
}: EditLinkModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "",
    description: "",
    author: "",
    publicationDate: today,
    boost: 1.0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (link) {
      let publicationDate = today;
      if (link.publicationYear && link.publicationMonth && link.publicationDay) {
        const m = String(link.publicationMonth).padStart(2, "0");
        const d = String(link.publicationDay).padStart(2, "0");
        publicationDate = `${link.publicationYear}-${m}-${d}`;
      } else if (link.publicationYear && link.publicationMonth) {
        const m = String(link.publicationMonth).padStart(2, "0");
        publicationDate = `${link.publicationYear}-${m}-01`;
      }
      setFormData({
        title: link.title || "",
        url: link.url || "",
        category: link.category || "",
        description: link.description || "",
        author: link.author || "",
        publicationDate,
        boost: link.boost ?? 1.0,
      });
    }
  }, [link, today]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "boost" ? parseFloat(value) || 1.0 : value,
    }));
    if (name === "author") {
      setShowAuthorSuggestions(true);
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, category: e.target.value }));
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

    if (!link) {
      setError("Link not found");
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("admin_token");
      const response = await fetch(`/api/links/${link.id}`, {
        method: "PATCH",
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
          boost: formData.boost,
          ...(formData.publicationDate ? (() => { const d = new Date(formData.publicationDate); return { publicationDay: d.getUTCDate(), publicationMonth: d.getUTCMonth() + 1, publicationYear: d.getUTCFullYear() }; })() : {}),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update link");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update link");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Edit Link</h2>
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
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
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
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
              <button
                type="button"
                onClick={async () => {
                  if (formData.url) {
                    setFormData((prev) => ({ ...prev, url: "" }));
                  } else {
                    const text = await navigator.clipboard.readText();
                    setFormData((prev) => ({ ...prev, url: text }));
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
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleCategoryChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-y"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              placeholder="Type to search authors..."
            />
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

          {/* Boost (Admin multiplier for hot score) */}
          <div>
            <label
              htmlFor="boost"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Boost Multiplier
            </label>
            <input
              type="number"
              id="boost"
              name="boost"
              value={formData.boost}
              onChange={handleInputChange}
              min="0.1"
              max="10"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            <p className="text-xs text-gray-500 mt-1">
              Affects hot score ranking (0.1 - 10.0, default: 1.0)
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? "Updating..." : "Update Link"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
