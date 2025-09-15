// SquadCard.tsx
export default function SquadCard({ squad }: { squad: any }) {
  return (
    <div className="p-4 bg-gray-50 border rounded-xl shadow-sm hover:shadow-md">
      <h3 className="font-semibold">{squad.name}</h3>
      <p className="text-sm text-gray-600">
        {squad.members.length} members • {squad.reputation} rep
      </p>
      <button className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-lg">
        View Squad
      </button>
    </div>
  );
}
