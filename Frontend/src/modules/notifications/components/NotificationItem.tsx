export default function NotificationItem({ notification }: { notification: any }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-lg shadow p-3">
      <span className="text-xl">{notification.icon || "🔔"}</span>
      <div className="flex-1">
        <div className="font-medium">{notification.title}</div>
        <div className="text-xs text-gray-500">{notification.time}</div>
      </div>
      {!notification.read && <span className="w-2 h-2 bg-indigo-500 rounded-full" />}
    </div>
  );
}
