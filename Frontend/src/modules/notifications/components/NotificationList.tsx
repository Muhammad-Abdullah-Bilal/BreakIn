import NotificationItem from "./NotificationItem";

export default function NotificationList({ notifications }: { notifications: any[] }) {
  if (!notifications.length) return <div className="text-gray-500">No notifications.</div>;
  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <NotificationItem key={notif.id} notification={notif} />
      ))}
    </div>
  );
}
