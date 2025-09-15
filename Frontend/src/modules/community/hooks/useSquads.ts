// useSquads.ts
import { useQuery } from "@tanstack/react-query";
import { fetchSquads } from "../services/squads.api";

export function useSquads() {
  return useQuery(["squads"], fetchSquads);
}
