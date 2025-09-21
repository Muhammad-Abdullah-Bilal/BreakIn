"use client";

import { useState } from "react";

const MOCK_NOTIFICATIONS = [
  { id: 1, title: "Sprint completed!", icon: "🏁", time: "1m ago", read: false, type: "squads" },
  { id: 2, title: "New recruiter ping", icon: "💼", time: "10m ago", read: false, type: "recruiter" },
  { id: 3, title: "System update", icon: "⚙️", time: "1h ago", read: true, type: "system" },
];

export function useNotifications() {
  const [filter, setFilter] = useState("all");
  const notifications = filter === "all"
    ? MOCK_NOTIFICATIONS
    : MOCK_NOTIFICATIONS.filter((n) => n.type === filter);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
  return { notifications, filter, setFilter, unreadCount };
}
