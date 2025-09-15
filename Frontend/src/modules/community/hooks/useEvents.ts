// useEvents.ts
import { useQuery } from "@tanstack/react-query";
import { fetchEvents } from "../services/events.api";

export function useEvents() {
  return useQuery(["events"], fetchEvents);
}
