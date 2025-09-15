import EventCard from "../components/EventCard";
import { useEvents } from "../hooks/useEvents";

export default function EventsPage() {
  const { data: events, isLoading } = useEvents();
  if (isLoading) return <div>Loading events...</div>;
  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">🎉 Events & Hackathons</h2>
      {events?.map((event: any) => <EventCard key={event.id} event={event} />)}
    </div>
  );
}
