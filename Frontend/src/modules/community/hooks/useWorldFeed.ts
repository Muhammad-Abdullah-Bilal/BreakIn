// useWorldFeed.ts
import { useQuery } from "@tanstack/react-query";
import { fetchWorldFeed } from "../services/feed.api";

export function useWorldFeed() {
  return useQuery(["worldFeed"], fetchWorldFeed);
}
