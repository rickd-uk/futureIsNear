"use client";

import React, { useState, useEffect, useRef } from "react";

interface Category {
  name: string;
  icon: string;
}

interface LinkData {
  id: string;
  title: string;
  url: string;
  category: string | null;
  description: string | null;
  author: string | null;
  publicationDay?: number | null;
  publicationMonth?: number | null;
  publicationYear?: number | null;
  isPublic: boolean;
}

interface FieldPrefs {
  showAuthor: boolean;
  showPubDate: boolean;
  showDescription: boolean;
}

interface UserSubmitLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  link?: LinkData;
}

function buildDateString(year?: number | null, month?: number | null, day?: number | null): string {
  if (!year) return new Date().toISOString().split("T")[0];
  const m = String(month ?? 1).padStart(2, "0");
  const d = String(day ?? 1).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

const DEFAULT_PREFS: FieldPrefs = { showAuthor: true, showPubDate: true, showDescription: true };

export default function UserSubmitLinkModal({ isOpen, onClose, onSuccess, link }: UserSubmitLinkModalProps) {
  const isEditMode = !!link;
  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({ title: "", url: "", category: "", description: "", author: "", publicationDate: today });
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [makePublic, setMakePublic] = useState(false);
  const [fetchingTitle, setFetchingTitle] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState("");
  const [suggestedAuthor, setSuggestedAuthor] = useState("");
  const [pasteHint, setPasteHint] = useState<"url" | "title" | null>(null);
  const [fieldPrefs, setFieldPrefs] = useState<FieldPrefs>(DEFAULT_PREFS);
  const urlInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchCategories();
    loadPreferences();
    if (isEditMode && link) {
      setFormData({
        title: link.title, url: link.url, category: link.category ?? "",
        description: link.description ?? "", author: link.author ?? "",
        publicationDate: buildDateString(link.publicationYear, link.publicationMonth, link.publicationDay),
      });
      setMakePublic(link.isPublic);
    } else {
      setFormData({ title: "", url: "", category: "", description: "", author: "", publicationDate: today });
      setSuggestedTitle(""); setSuggestedAuthor("");
      const pref = localStorage.getItem("user_links_public_default");
      setMakePublic(pref === "true");
    }
    setError("");
  }, [isOpen, isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPreferences = async () => {
    const token = localStorage.getItem("user_token");
    if (!token) return;
    try {
      const res = await fetch("/api/user/preferences", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setFieldPrefs({
          showAuthor: data.showAuthor !== false,
          showPubDate: data.showPubDate !== false,
          showDescription: data.showDescription !== false,
        });
      }
    } catch { /* use defaults */ }
  };

  const savePreference = async (key: keyof FieldPrefs, value: boolean) => {
    const next = { ...fieldPrefs, [key]: value };
    setFieldPrefs(next);
    const token = localStorage.getItem("user_token");
    if (!token) return;
    try {
      await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
    } catch { /* ignore */ }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories?withIcons=true");
      setCategories(await res.json());
    } catch { /* ignore */ }
  };

  const fetchTitle = async (url: string) => {
    setSuggestedTitle(""); setFetchingTitle(true);
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
    } catch { /* ignore */ } finally { setFetchingTitle(false); }
  };

  const readClipboard = async (field: "url" | "title", fallbackRef?: React.RefObject<HTMLInputElement | null>): Promise<string> => {
    try {
      return await (navigator.clipboard?.readText() ?? Promise.reject()) ?? "";
    } catch {
      fallbackRef?.current?.focus();
      setPasteHint(field);
      setTimeout(() => setPasteHint(null), 3000);
      return "";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true); setError("");
    try {
      const token = localStorage.getItem("user_token");
      const pubDate = formData.publicationDate ? new Date(formData.publicationDate) : null;
      const payload = {
        title: formData.title, url: formData.url, category: formData.category || null,
        description: formData.description, author: formData.author || null,
        publicationDay: pubDate ? pubDate.getUTCDate() : null,
        publicationMonth: pubDate ? pubDate.getUTCMonth() + 1 : null,
        publicationYear: pubDate ? pubDate.getUTCFullYear() : null,
        isPublic: makePublic,
      };
      const response = isEditMode
        ? await fetch(`/api/links/${link!.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) })
        : await fetch("/api/links/create", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...payload, makePublic }) });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed");
      }
      onSuccess(); onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally { setIsSubmitting(false); }
  };

  const handlePublicToggle = (checked: boolean) => {
    setMakePublic(checked);
    if (!isEditMode) localStorage.setItem("user_links_public_default", String(checked));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg sm:max-w-xl lg:max-w-2xl my-auto flex flex-col">

        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{isEditMode ? "Edit Link" : "Add a Link"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Field toggles */}
        <div className="px-4 pt-3 pb-0 flex items-center gap-2 flex-wrap shrink-0">
          <span className="text-xs text-gray-400 mr-1">Show:</span>
          {(["showAuthor", "showPubDate", "showDescription"] as (keyof FieldPrefs)[]).map((key) => {
            const labels: Record<keyof FieldPrefs, string> = { showAuthor: "Author", showPubDate: "Date", showDescription: "Description" };
            const on = fieldPrefs[key];
            return (
              <button key={key} type="button" onClick={() => savePreference(key, !on)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${on ? "bg-blue-50 border-blue-300 text-blue-700" : "bg-gray-50 border-gray-200 text-gray-400"}`}>
                {on ? "✓" : "+"} {labels[key]}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-3">

          {/* Title */}
          <div className="space-y-1 shrink-0">
            <div className="flex gap-2">
              <input ref={titleInputRef} type="text" name="title" value={formData.title} onChange={handleInputChange} required
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={fetchingTitle ? "Fetching title..." : "Title *"} />
              <button type="button" onClick={async () => {
                if (formData.title) { setFormData((p) => ({ ...p, title: "" })); setSuggestedTitle(""); }
                else { const t = await readClipboard("title", titleInputRef); if (t) setFormData((p) => ({ ...p, title: t })); }
              }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 shrink-0">
                {formData.title ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              </button>
            </div>
            {pasteHint === "title" && <p className="text-xs text-amber-600 px-1">Clipboard unavailable — press Ctrl+V to paste</p>}
            {suggestedTitle && (
              <button type="button" onClick={() => { setFormData((p) => ({ ...p, title: suggestedTitle })); setSuggestedTitle(""); }}
                className="text-xs text-blue-600 hover:text-blue-800 text-left truncate w-full px-1">↑ Use: {suggestedTitle}</button>
            )}
          </div>

          {/* URL */}
          <div className="space-y-1 shrink-0">
            <div className="flex gap-2">
              <input ref={urlInputRef} type="url" name="url" value={formData.url} onChange={handleInputChange} required
                onPaste={(e) => { const t = e.clipboardData?.getData("text") ?? ""; if (t.startsWith("http")) setTimeout(() => fetchTitle(t), 0); }}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="URL *  https://..." />
              <button type="button" onClick={async () => {
                if (formData.url) { setFormData((p) => ({ ...p, url: "" })); setSuggestedTitle(""); setSuggestedAuthor(""); }
                else { const t = await readClipboard("url", urlInputRef); if (t) { setFormData((p) => ({ ...p, url: t })); if (t.startsWith("http")) fetchTitle(t); } }
              }} className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 shrink-0">
                {formData.url ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              </button>
            </div>
            {pasteHint === "url" && <p className="text-xs text-amber-600 px-1">Clipboard unavailable — press Ctrl+V to paste</p>}
          </div>

          {/* Category + Author */}
          <div className={`shrink-0 ${fieldPrefs.showAuthor ? "flex gap-2" : ""}`}>
            <select name="category" value={formData.category} onChange={handleInputChange}
              className={`border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${fieldPrefs.showAuthor ? "flex-1" : "w-full"}`}>
              <option value="">Category (optional)</option>
              {categories.map((cat) => <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>)}
            </select>
            {fieldPrefs.showAuthor && (
              <div className="flex-1 space-y-1">
                <input type="text" name="author" value={formData.author} onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Author (optional)" />
                {suggestedAuthor && !formData.author && (
                  <button type="button" onClick={() => { setFormData((p) => ({ ...p, author: suggestedAuthor })); setSuggestedAuthor(""); }}
                    className="text-xs text-blue-600 hover:text-blue-800 text-left px-1">↑ Use: {suggestedAuthor}</button>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          {fieldPrefs.showDescription && (
            <textarea name="description" value={formData.description} onChange={handleInputChange}
              rows={7}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Description (optional)" />
          )}

          {/* Pub date + Visibility */}
          <div className="flex flex-wrap gap-x-8 gap-y-3 shrink-0">
            {fieldPrefs.showPubDate && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-500">Publication date</label>
                <input type="date" name="publicationDate" value={formData.publicationDate} onChange={handleInputChange}
                  className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Visibility</label>
              <div className="flex items-center gap-2 h-[34px]" title={!formData.category ? "Select a category to make public" : undefined}>
                <span className={`text-sm ${!formData.category ? "text-gray-400" : "text-gray-700"}`}>
                  {makePublic && formData.category ? "Public" : "Private"}
                </span>
                <button type="button"
                  onClick={() => formData.category && handlePublicToggle(!makePublic)}
                  disabled={!formData.category}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${makePublic && formData.category ? "bg-green-500" : "bg-gray-300"} ${!formData.category ? "opacity-50 cursor-not-allowed" : ""}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${makePublic && formData.category ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            </div>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm shrink-0">{error}</div>}

          <div className="flex gap-3 pt-1 shrink-0">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium">
              {isSubmitting ? (isEditMode ? "Saving..." : "Adding...") : (isEditMode ? "Save" : "Add")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
