// useReputation.ts
import { useQuery } from "@tanstack/react-query";
import { fetchReputation } from "../services/reputation.api";

export function useReputation(userId: string) {
  return useQuery(["reputation", userId], () => fetchReputation(userId));
}
