"use client";

import { useState, useCallback } from "react";
import { MAX_VOTES_PER_LINK, DAILY_VOTE_BUDGET } from "@/lib/votingConfig";

interface UseVotingReturn {
  votes: Map<string, number>;
  remainingBudget: number;
  vote: (linkId: string, count: number) => Promise<boolean>;
  removeVote: (linkId: string) => Promise<boolean>;
  getVoteCount: (linkId: string) => number;
  canVote: (linkId: string) => boolean;
  initFromServer: (userVotes: Record<string, number>, budget: number) => void;
}

export function useVoting(isAuthenticated: boolean): UseVotingReturn {
  const [votes, setVotes] = useState<Map<string, number>>(new Map());
  const [remainingBudget, setRemainingBudget] = useState(DAILY_VOTE_BUDGET);

  const initFromServer = useCallback((userVotes: Record<string, number>, budget: number) => {
    setVotes(new Map(Object.entries(userVotes)));
    setRemainingBudget(budget);
  }, []);

  const getVoteCount = useCallback(
    (linkId: string): number => votes.get(linkId) || 0,
    [votes]
  );

  const canVote = useCallback(
    (linkId: string): boolean => {
      if (!isAuthenticated) return false;
      if ((votes.get(linkId) || 0) >= MAX_VOTES_PER_LINK) return false;
      if (remainingBudget <= 0) return false;
      return true;
    },
    [isAuthenticated, votes, remainingBudget]
  );

  const vote = useCallback(
    async (linkId: string, count: number): Promise<boolean> => {
      if (!isAuthenticated) return false;

      const currentCount = getVoteCount(linkId);
      const additionalVotes = count - currentCount;
      const previousVotes = new Map(votes);
      const previousBudget = remainingBudget;

      setVotes((prev) => { const m = new Map(prev); m.set(linkId, count); return m; });
      if (additionalVotes > 0) setRemainingBudget((prev) => Math.max(0, prev - additionalVotes));

      try {
        const token = localStorage.getItem("user_token");
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ linkId, count }),
        });

        if (!response.ok) {
          setVotes(previousVotes);
          setRemainingBudget(previousBudget);
          return false;
        }

        const data = await response.json();
        setRemainingBudget(data.remainingBudget);
        return true;
      } catch {
        setVotes(previousVotes);
        setRemainingBudget(previousBudget);
        return false;
      }
    },
    [isAuthenticated, votes, remainingBudget, getVoteCount]
  );

  const removeVote = useCallback(
    async (linkId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;

      const previousVotes = new Map(votes);
      const previousBudget = remainingBudget;
      setVotes((prev) => { const m = new Map(prev); m.delete(linkId); return m; });

      try {
        const token = localStorage.getItem("user_token");
        const response = await fetch(`/api/votes?linkId=${linkId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          setVotes(previousVotes);
          setRemainingBudget(previousBudget);
          return false;
        }

        const data = await response.json();
        setRemainingBudget(data.remainingBudget);
        return true;
      } catch {
        setVotes(previousVotes);
        setRemainingBudget(previousBudget);
        return false;
      }
    },
    [isAuthenticated, votes, remainingBudget]
  );

  return { votes, remainingBudget, vote, removeVote, getVoteCount, canVote, initFromServer };
}
