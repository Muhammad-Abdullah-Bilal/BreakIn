import { useNotifications } from "../hooks/useNotifications";

export default function NotificationBell({ onClick }: { onClick?: () => void }) {
  const { unreadCount } = useNotifications();
  return (
    <button onClick={onClick} className="relative p-2" aria-label="Notifications">
      <span className="material-icons text-2xl">notifications</span>
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5">
          {unreadCount}
        </span>
      )}
    </button>
  );
}
