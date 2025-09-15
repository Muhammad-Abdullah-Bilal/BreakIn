export default function RecruiterPingCard({ ping }: { ping: any }) {
  return (
    <div className="bg-white rounded-xl shadow p-4 mb-3 flex flex-col gap-1">
      <div className="font-semibold">{ping.from}</div>
      <div className="text-gray-700 text-sm">{ping.message}</div>
      <div className="text-xs text-gray-400">{ping.time}</div>
      <button className="mt-2 px-3 py-1 bg-indigo-600 text-white rounded">Reply</button>
    </div>
  );
}
