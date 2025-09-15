import NotificationList from "../components/NotificationList";
import { useNotifications } from "../hooks/useNotifications";

export default function NotificationsPage() {
  const { notifications, filter, setFilter } = useNotifications();
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>
      <div className="mb-4 flex gap-2">
        {["all", "squads", "system", "recruiter"].map((f) => (
          <button
            key={f}
            className={`px-3 py-1 rounded ${filter === f ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
