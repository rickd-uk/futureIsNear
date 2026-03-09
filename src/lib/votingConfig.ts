export const MAX_VOTES_PER_LINK = 3;
export const DAILY_VOTE_BUDGET = 10;
export const TIME_DECAY_FACTOR = 1.5;

export function calculateHotScore(
  totalVotes: number,
  boost: number,
  createdAt: Date
): number {
  const now = new Date();
  const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
  return ((totalVotes + 1) * boost) / Math.pow(ageInHours + 2, TIME_DECAY_FACTOR);
}
