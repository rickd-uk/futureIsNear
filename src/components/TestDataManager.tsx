// src/components/TestDataManager.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";

interface TestUser {
  id: string;
  username: string;
  email: string | null;
  createdAt: string;
  _count: { links: number };
}

interface TestDataManagerProps {
  adminToken: string;
}

export default function TestDataManager({ adminToken }: TestDataManagerProps) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<TestUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState("");

  // Generate form state
  const [userCount, setUserCount] = useState(5);
  const [linksPerUser, setLinksPerUser] = useState("4");
  const [password, setPassword] = useState("testpass123");

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seed", { headers: { Authorization: `Bearer ${adminToken}` } });
      if (res.ok) setUsers((await res.json()).users ?? []);
    } finally {
      setLoading(false);
    }
  }, [adminToken]);

  useEffect(() => {
    if (open) fetchUsers();
  }, [open, fetchUsers]);

  const generate = async () => {
    if (password.length < 8) { setStatus("Password must be at least 8 characters."); return; }
    setWorking(true);
    setStatus("Generating…");
    try {
      const res = await fetch("/api/admin/seed", {
        method: "POST",
        headers,
        body: JSON.stringify({ userCount, linksPerUser: linksPerUser.trim() || "3", password }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Created ${data.created.length} users.`);
        await fetchUsers();
      } else {
        setStatus(data.error ?? "Error generating data.");
      }
    } finally {
      setWorking(false);
    }
  };

  const deleteUser = async (userId: string) => {
    setWorking(true);
    try {
      const res = await fetch(`/api/admin/seed/${userId}`, { method: "DELETE", headers });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStatus("User deleted.");
      }
    } finally {
      setWorking(false);
    }
  };

  const deleteAll = async () => {
    if (!confirm(`Delete all ${users.length} test users and their links? This cannot be undone.`)) return;
    setWorking(true);
    setStatus("Deleting all test users…");
    try {
      const res = await fetch("/api/admin/seed", { method: "DELETE", headers });
      const data = await res.json();
      if (res.ok) {
        setUsers([]);
        setStatus(`Deleted ${data.deleted} test users.`);
      }
    } finally {
      setWorking(false);
    }
  };

  const totalLinks = users.reduce((s, u) => s + u._count.links, 0);

  return (
    <div className="bg-white rounded-lg shadow mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-gray-900">🧪 Test Data</span>
          {users.length > 0 && (
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {users.length} users · {totalLinks} links
            </span>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-200 px-4 py-4 space-y-5">

          {/* Generate form */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Generate dummy users &amp; links</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Users</label>
                <input
                  type="number" min={1} max={50} value={userCount}
                  onChange={(e) => setUserCount(Math.min(50, Math.max(1, +e.target.value)))}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Links / user</label>
                <input
                  type="text" value={linksPerUser} placeholder="e.g. 6 or 2-8"
                  onChange={(e) => setLinksPerUser(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1">Password (all users)</label>
                <input
                  type="text" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={generate}
                disabled={working}
                className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                type="button"
              >
                {working ? "Working…" : "Generate"}
              </button>
              {status && <span className="text-xs text-gray-500">{status}</span>}
            </div>
          </div>

          {/* User list */}
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No test users yet.</p>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {users.length} test user{users.length !== 1 ? "s" : ""} · {totalLinks} links total
                </h3>
                <button
                  onClick={deleteAll}
                  disabled={working}
                  className="text-xs px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 transition-colors"
                  type="button"
                >
                  Delete all test users
                </button>
              </div>
              <div className="overflow-x-auto rounded border border-gray-200">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium">Username</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium hidden sm:table-cell">Email</th>
                      <th className="px-3 py-2 text-center text-gray-600 font-medium">Links</th>
                      <th className="px-3 py-2 text-left text-gray-600 font-medium hidden sm:table-cell">Created</th>
                      <th className="px-3 py-2 text-gray-600 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-mono text-gray-900">{u.username}</td>
                        <td className="px-3 py-2 text-gray-500 hidden sm:table-cell">{u.email ?? "—"}</td>
                        <td className="px-3 py-2 text-center">
                          <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{u._count.links}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400 hidden sm:table-cell">
                          {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => deleteUser(u.id)}
                            disabled={working}
                            title="Delete user and links"
                            className="text-red-400 hover:text-red-600 disabled:opacity-50 p-1 rounded hover:bg-red-50 transition-colors"
                            type="button"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
