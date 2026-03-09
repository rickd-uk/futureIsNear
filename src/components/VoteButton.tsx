"use client";

import React from "react";
import { MAX_VOTES_PER_LINK } from "@/lib/votingConfig";

interface VoteButtonProps {
  linkId: string;
  totalVotes: number;
  userVoteCount: number;
  isAuthenticated: boolean;
  remainingBudget: number;
  onVote: (linkId: string, count: number) => Promise<boolean>;
  onRemoveVote: (linkId: string) => Promise<boolean>;
}

export default function VoteButton({
  linkId,
  totalVotes,
  userVoteCount,
  isAuthenticated,
  remainingBudget,
  onVote,
  onRemoveVote,
}: VoteButtonProps) {
  const handleClick = async () => {
    if (!isAuthenticated) return;

    if (userVoteCount >= MAX_VOTES_PER_LINK) {
      // Already at max, remove vote
      await onRemoveVote(linkId);
    } else {
      // Increment vote
      const newCount = userVoteCount + 1;
      await onVote(linkId, newCount);
    }
  };

  const canIncrement =
    isAuthenticated &&
    userVoteCount < MAX_VOTES_PER_LINK &&
    remainingBudget > 0;

  const getButtonStyle = () => {
    if (!isAuthenticated) {
      return "text-gray-400 cursor-not-allowed";
    }
    if (userVoteCount > 0) {
      return "text-orange-500 hover:text-orange-600";
    }
    if (remainingBudget === 0) {
      return "text-gray-400 cursor-not-allowed";
    }
    return "text-gray-400 hover:text-orange-500";
  };

  const getTitle = () => {
    if (!isAuthenticated) {
      return "Login to vote";
    }
    if (userVoteCount >= MAX_VOTES_PER_LINK) {
      return "Click to remove your votes";
    }
    if (remainingBudget === 0) {
      return "No daily votes remaining";
    }
    return `Click to vote (${userVoteCount}/${MAX_VOTES_PER_LINK})`;
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isAuthenticated || (!canIncrement && userVoteCount === 0)}
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
        <div className="flex gap-1">
          {Array.from({ length: userVoteCount }).map((_, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-orange-500"
            />
          ))}
        </div>
      )}
    </button>
  );
}
