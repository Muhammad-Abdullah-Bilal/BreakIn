// EventCard.tsx
export default function EventCard({ event }: { event: any }) {
  return (
    <div className="p-4 bg-white border rounded-xl shadow-sm mb-4">
      <h4 className="font-semibold">{event.title}</h4>
      <p className="text-gray-700 text-sm">{event.description}</p>
      <div className="mt-2 text-xs text-gray-500">{event.date}</div>
    </div>
  );
}
