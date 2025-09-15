import { useRealtime } from "../hooks/useRealtime";

export default function SquadActivityStream({ squadId }: { squadId: string }) {
  const { events } = useRealtime(`squad:${squadId}`);
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <h3 className="font-semibold mb-2">Squad Activity</h3>
      <ul className="space-y-1 text-sm">
        {events.map((e: any, i: number) => (
          <li key={i}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
}
