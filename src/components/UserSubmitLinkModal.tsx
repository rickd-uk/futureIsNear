"use client";

import React, { useState, useEffect } from "react";

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
  const [formData, setFormData] = useState({
    title: "",
    url: "",
    category: "",
    description: "",
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [makePublic, setMakePublic] = useState(false);

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

      const response = await fetch("/api/links/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          makePublic,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit link");
      }

      // Reset form
      setFormData({ title: "", url: "", category: "", description: "" });
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
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Title *"
          />

          <input
            type="url"
            id="url"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="URL *  https://..."
          />

          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Category *</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <div>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:resize-y"
              placeholder="Description (optional)"
            />
          </div>

          {/* Visibility toggle */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Make Public</p>
                <p className="text-xs text-gray-500">
                  {makePublic ? "Link will be visible to everyone" : "Only you can see this link"}
                </p>
              </div>
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
            <p className="text-xs text-gray-400 mt-2">
              This preference is saved for future submissions
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

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
              {isSubmitting ? "Adding..." : "Add Link"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
