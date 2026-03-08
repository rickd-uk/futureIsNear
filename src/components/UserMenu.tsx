"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { User, LogOut, ChevronDown } from "lucide-react";

interface UserMenuProps {
  remainingBudget?: number;
}

export default function UserMenu({ remainingBudget }: UserMenuProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return <div className="w-20 h-8 rounded bg-blue-500/30 animate-pulse" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="text-white hover:text-blue-200 text-sm font-medium px-2 py-1"
        >
          Log In
        </Link>
        <Link
          href="/signup"
          className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-blue-50"
        >
          Sign Up
        </Link>
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-white hover:text-blue-200 px-3 py-1.5 rounded transition-colors"
      >
        <User className="w-5 h-5" />
        <span className="text-base font-medium">{user?.username}</span>
        {remainingBudget !== undefined && (
          <span className="text-sm bg-orange-500 text-white px-2 py-0.5 rounded-full font-medium">
            {remainingBudget}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-base font-medium text-gray-900">
              {user?.username}
            </p>
            {user?.email && (
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
            )}
            {remainingBudget !== undefined && (
              <p className="text-sm text-orange-600 mt-1 font-medium">
                {remainingBudget} votes remaining today
              </p>
            )}
          </div>
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
