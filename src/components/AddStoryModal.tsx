// src/components/AddStoryModal.tsx
"use client";

import React, { useState, useRef } from "react";

interface AddStoryModalProps {
  isOpen: boolean;
  categories: string[];
  authors: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStoryModal({
  isOpen,
  categories,
  authors,
  onClose,
  onSuccess,
}: AddStoryModalProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "",
    description: "",
    author: "",
    publicationMonth: currentMonth,
    publicationYear: currentYear,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false);
  const authorInputRef = useRef<HTMLInputElement>(null);

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  const years = Array.from({ length: 11 }, (_, i) => currentYear - i);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "publicationMonth" || name === "publicationYear"
          ? parseInt(value)
          : value,
    }));
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
      const response = await fetch("/api/stories/create", {
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
          publicationMonth: formData.publicationMonth,
          publicationYear: formData.publicationYear,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create story");
      }

      setFormData({
        title: "",
        url: "",
        category: "",
        description: "",
        author: "",
        publicationMonth: currentMonth,
        publicationYear: currentYear,
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create story");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Add New Story</h2>
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
            <input
              type="url"
              id="url"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
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
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Publication Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publication Date
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="publicationMonth"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Month
                </label>
                <select
                  id="publicationMonth"
                  name="publicationMonth"
                  value={formData.publicationMonth}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {months.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="publicationYear"
                  className="block text-xs text-gray-600 mb-1"
                >
                  Year
                </label>
                <select
                  id="publicationYear"
                  name="publicationYear"
                  value={formData.publicationYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
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
              rows={4}
              placeholder="Optional description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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
              placeholder="Type to search authors..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
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

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding Story..." : "Add Story"}
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
