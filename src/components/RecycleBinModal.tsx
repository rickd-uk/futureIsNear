// src/components/RecycleBinModal.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TrashLink {
  id: string;
  title: string;
  url: string;
  category: string | null;
  author: string | null;
  timestamp: string;
  deletedAt: string;
}

interface RecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestored: () => void; // called when items are restored so feed refreshes
  onCountChange: (count: number) => void;
}

export default function RecycleBinModal({ isOpen, onClose, onRestored, onCountChange }: RecycleBinModalProps) {
  const [links, setLinks] = useState<TrashLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [working, setWorking] = useState(false);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("user_token");
      const res = await fetch("/api/links/trash", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setLinks(data.links ?? []);
        onCountChange(data.count ?? 0);
      }
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchTrash();
      setSelected(new Set());
    }
  }, [isOpen, fetchTrash]);

  const token = () => localStorage.getItem("user_token");
  const authHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token()}`,
  });

  const restore = async (ids: string[]) => {
    setWorking(true);
    try {
      await fetch("/api/links/trash", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });
      const updated = links.filter((l) => !ids.includes(l.id));
      setLinks(updated);
      setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n; });
      onCountChange(updated.length);
      onRestored();
    } finally {
      setWorking(false);
    }
  };

  const permanentDelete = async (ids: string[]) => {
    setWorking(true);
    try {
      await fetch("/api/links/trash", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ ids }),
      });
      const updated = links.filter((l) => !ids.includes(l.id));
      setLinks(updated);
      setSelected((s) => { const n = new Set(s); ids.forEach((id) => n.delete(id)); return n; });
      onCountChange(updated.length);
    } finally {
      setWorking(false);
    }
  };

  const emptyBin = async () => {
    setWorking(true);
    try {
      await fetch("/api/links/trash", {
        method: "DELETE",
        headers: authHeaders(),
        body: JSON.stringify({ all: true }),
      });
      setLinks([]);
      setSelected(new Set());
      onCountChange(0);
    } finally {
      setWorking(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) { n.delete(id); } else { n.add(id); }
      return n;
    });
  };

  const allSelected = links.length > 0 && selected.size === links.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(links.map((l) => l.id)));

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (!isOpen) return null;

  const selectedArr = Array.from(selected);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗑️</span>
            <h2 className="text-lg font-semibold text-gray-900">Recycle Bin</h2>
            {links.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">{links.length}</span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Toolbar */}
        {links.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-gray-100 bg-gray-50 shrink-0 flex-wrap">
            <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 mr-auto">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} className="rounded" />
              {allSelected ? "Deselect all" : "Select all"}
            </label>
            {selectedArr.length > 0 && (
              <>
                <button
                  onClick={() => restore(selectedArr)}
                  disabled={working}
                  className="text-xs px-3 py-1.5 rounded-md bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                >
                  ↩ Restore {selectedArr.length}
                </button>
                <button
                  onClick={() => permanentDelete(selectedArr)}
                  disabled={working}
                  className="text-xs px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 transition-colors"
                >
                  Delete {selectedArr.length}
                </button>
              </>
            )}
            <button
              onClick={emptyBin}
              disabled={working}
              className="text-xs px-3 py-1.5 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors ml-auto"
            >
              Empty bin
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
          ) : links.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Recycle bin is empty</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {links.map((link) => (
                <li key={link.id} className={`flex items-start gap-3 px-5 py-3 hover:bg-gray-50 transition-colors ${selected.has(link.id) ? "bg-blue-50" : ""}`}>
                  <input
                    type="checkbox"
                    checked={selected.has(link.id)}
                    onChange={() => toggleSelect(link.id)}
                    className="mt-1 rounded flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{link.title}</p>
                    <p className="text-xs text-gray-500 truncate">{link.url}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {link.category && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">{link.category}</span>
                      )}
                      <span className="text-xs text-gray-400">Deleted {fmtDate(link.deletedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => restore([link.id])}
                      disabled={working}
                      title="Restore"
                      className="p-1.5 rounded text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button
                      onClick={() => permanentDelete([link.id])}
                      disabled={working}
                      title="Delete permanently"
                      className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
