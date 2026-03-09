"use client";

import React from "react";
import { MAX_VOTES_PER_LINK } from "@/lib/votingConfig";

interface VoteButtonProps {
  linkId: string;
  totalVotes: number;
  userVoteCount: number;
  isAuthenticated: boolean;
  remainingBudget: number;
  locked?: boolean; // voting blocked (e.g. uncategorized, non-owner)
  onVote: (linkId: string, count: number) => Promise<boolean>;
  onRemoveVote: (linkId: string) => Promise<boolean>;
}

export default function VoteButton({
  linkId,
  totalVotes,
  userVoteCount,
  isAuthenticated,
  remainingBudget,
  locked = false,
  onVote,
}: VoteButtonProps) {
  const atMax = userVoteCount >= MAX_VOTES_PER_LINK;
  const canVote = !locked && isAuthenticated && !atMax && remainingBudget > 0;

  const handleClick = async () => {
    if (!canVote) return;
    await onVote(linkId, userVoteCount + 1);
  };

  const getButtonStyle = () => {
    if (locked) return "text-gray-300 cursor-not-allowed";
    if (!isAuthenticated) return "text-gray-400 cursor-not-allowed";
    if (atMax) return "text-orange-500 cursor-default";
    if (userVoteCount > 0) return "text-orange-500 hover:text-orange-600";
    if (remainingBudget === 0) return "text-gray-400 cursor-not-allowed";
    return "text-gray-400 hover:text-orange-500";
  };

  const getTitle = () => {
    if (locked) return "Assign a category to enable voting";
    if (!isAuthenticated) return "Login to vote";
    if (atMax) return `Max votes given (${MAX_VOTES_PER_LINK}/${MAX_VOTES_PER_LINK})`;
    if (remainingBudget === 0) return "No votes remaining today";
    return `Vote (${userVoteCount}/${MAX_VOTES_PER_LINK}) — ${remainingBudget} left today`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={!canVote}
      className={`flex flex-col items-center gap-0.5 transition-colors ${getButtonStyle()}`}
      title={getTitle()}
    >
      {/* Upvote Arrow */}
      <svg
        className="w-6 h-6"
        fill={userVoteCount > 0 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>

      {/* Vote Count */}
      <span className="text-sm font-semibold">{totalVotes}</span>

      {/* User's vote indicator */}
      {isAuthenticated && userVoteCount > 0 && (
        <div className="w-6 h-1 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full transition-all"
            style={{ width: `${(userVoteCount / MAX_VOTES_PER_LINK) * 100}%` }}
          />
        </div>
      )}
    </button>
  );
}
