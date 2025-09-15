// notifications.api.ts
export async function fetchNotifications() {
  // TODO: Replace with real API call
  return [
    { id: 1, title: "Sprint completed!", icon: "🏁", time: "1m ago", read: false, type: "squads" },
    { id: 2, title: "New recruiter ping", icon: "💼", time: "10m ago", read: false, type: "recruiter" },
    { id: 3, title: "System update", icon: "⚙️", time: "1h ago", read: true, type: "system" },
  ];
}

export async function markNotificationRead(id: number) {
  // TODO: Implement API call
  return true;
}

export async function clearNotifications() {
  // TODO: Implement API call
  return true;
}
