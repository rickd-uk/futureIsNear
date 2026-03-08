"use client";

import { useState, useEffect, useCallback } from "react";
import { MAX_VOTES_PER_STORY, DAILY_VOTE_BUDGET } from "@/lib/votingConfig";

interface VoteData {
  storyId: string;
  count: number;
}

interface UseVotingReturn {
  votes: Map<string, number>;
  remainingBudget: number;
  loading: boolean;
  vote: (storyId: string, count: number) => Promise<boolean>;
  removeVote: (storyId: string) => Promise<boolean>;
  getVoteCount: (storyId: string) => number;
  canVote: (storyId: string, additionalVotes?: number) => boolean;
}

export function useVoting(isAuthenticated: boolean): UseVotingReturn {
  const [votes, setVotes] = useState<Map<string, number>>(new Map());
  const [remainingBudget, setRemainingBudget] = useState(DAILY_VOTE_BUDGET);
  const [loading, setLoading] = useState(true);

  const fetchVotes = useCallback(async () => {
    if (!isAuthenticated) {
      setVotes(new Map());
      setRemainingBudget(DAILY_VOTE_BUDGET);
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("user_token");
      const response = await fetch("/api/votes", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const voteMap = new Map<string, number>();
        data.votes.forEach((v: VoteData) => {
          voteMap.set(v.storyId, v.count);
        });
        setVotes(voteMap);
        setRemainingBudget(data.remainingBudget);
      }
    } catch (error) {
      console.error("Failed to fetch votes:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchVotes();
  }, [fetchVotes]);

  const getVoteCount = useCallback(
    (storyId: string): number => {
      return votes.get(storyId) || 0;
    },
    [votes]
  );

  const canVote = useCallback(
    (storyId: string, additionalVotes: number = 1): boolean => {
      if (!isAuthenticated) return false;

      const currentVotes = getVoteCount(storyId);
      const newTotal = currentVotes + additionalVotes;

      // Check if exceeds max votes per story
      if (newTotal > MAX_VOTES_PER_STORY) return false;

      // Check if has remaining budget
      if (additionalVotes > remainingBudget) return false;

      return true;
    },
    [isAuthenticated, getVoteCount, remainingBudget]
  );

  const vote = useCallback(
    async (storyId: string, count: number): Promise<boolean> => {
      if (!isAuthenticated) return false;

      const currentCount = getVoteCount(storyId);
      const additionalVotes = count - currentCount;

      // Optimistic update
      const previousVotes = new Map(votes);
      const previousBudget = remainingBudget;

      setVotes((prev) => {
        const newVotes = new Map(prev);
        newVotes.set(storyId, count);
        return newVotes;
      });

      if (additionalVotes > 0) {
        setRemainingBudget((prev) => Math.max(0, prev - additionalVotes));
      }

      try {
        const token = localStorage.getItem("user_token");
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ storyId, count }),
        });

        if (!response.ok) {
          // Revert on failure
          setVotes(previousVotes);
          setRemainingBudget(previousBudget);
          return false;
        }

        const data = await response.json();
        setRemainingBudget(data.remainingBudget);
        return true;
      } catch (error) {
        console.error("Failed to vote:", error);
        // Revert on failure
        setVotes(previousVotes);
        setRemainingBudget(previousBudget);
        return false;
      }
    },
    [isAuthenticated, votes, remainingBudget, getVoteCount]
  );

  const removeVote = useCallback(
    async (storyId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      // Optimistic update
      const previousVotes = new Map(votes);
      const previousBudget = remainingBudget;

      setVotes((prev) => {
        const newVotes = new Map(prev);
        newVotes.delete(storyId);
        return newVotes;
      });

      try {
        const token = localStorage.getItem("user_token");
        const response = await fetch(`/api/votes?storyId=${storyId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          // Revert on failure
          setVotes(previousVotes);
          setRemainingBudget(previousBudget);
          return false;
        }

        const data = await response.json();
        setRemainingBudget(data.remainingBudget);
        return true;
      } catch (error) {
        console.error("Failed to remove vote:", error);
        // Revert on failure
        setVotes(previousVotes);
        setRemainingBudget(previousBudget);
        return false;
      }
    },
    [isAuthenticated, votes, remainingBudget]
  );

  return {
    votes,
    remainingBudget,
    loading,
    vote,
    removeVote,
    getVoteCount,
    canVote,
  };
}
