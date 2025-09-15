// useLeaderboards.ts
import { useQuery } from "@tanstack/react-query";
import { fetchLeaderboards } from "../services/leaderboard.api";

export function useLeaderboards() {
  return useQuery(["leaderboards"], fetchLeaderboards);
}
