"use client";

import React from "react";
import { MAX_VOTES_PER_STORY } from "@/lib/votingConfig";

interface VoteButtonProps {
  storyId: string;
  totalVotes: number;
  userVoteCount: number;
  isAuthenticated: boolean;
  remainingBudget: number;
  onVote: (storyId: string, count: number) => Promise<boolean>;
  onRemoveVote: (storyId: string) => Promise<boolean>;
}

export default function VoteButton({
  storyId,
  totalVotes,
  userVoteCount,
  isAuthenticated,
  remainingBudget,
  onVote,
  onRemoveVote,
}: VoteButtonProps) {
  const handleClick = async () => {
    if (!isAuthenticated) return;

    if (userVoteCount >= MAX_VOTES_PER_STORY) {
      // Already at max, remove vote
      await onRemoveVote(storyId);
    } else {
      // Increment vote
      const newCount = userVoteCount + 1;
      await onVote(storyId, newCount);
    }
  };

  const canIncrement =
    isAuthenticated &&
    userVoteCount < MAX_VOTES_PER_STORY &&
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
    if (userVoteCount >= MAX_VOTES_PER_STORY) {
      return "Click to remove your votes";
    }
    if (remainingBudget === 0) {
      return "No daily votes remaining";
    }
    return `Click to vote (${userVoteCount}/${MAX_VOTES_PER_STORY})`;
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
        className="w-4 h-4"
        fill={userVoteCount > 0 ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      </svg>

      {/* Vote Count */}
      <span className="text-xs font-medium">{totalVotes}</span>

      {/* User's vote indicator */}
      {isAuthenticated && userVoteCount > 0 && (
        <div className="flex gap-0.5">
          {Array.from({ length: userVoteCount }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-orange-500"
            />
          ))}
        </div>
      )}
    </button>
  );
}
