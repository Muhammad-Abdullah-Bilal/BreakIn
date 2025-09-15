export default function MatchList({ matches }: { matches?: any[] }) {
  const MOCK = matches || [
    { id: 'm1', name: 'Anon Dev', proofScore: 88 },
    { id: 'm2', name: 'Dev Two', proofScore: 91 },
  ];
  return (
    <div className="space-y-3">
      {MOCK.map(m => (
        <div key={m.id} className="p-3 bg-white rounded-lg shadow flex items-center justify-between">
          <div>
            <div className="font-medium">{m.name}</div>
            <div className="text-xs text-gray-500">{m.proofScore} pt</div>
          </div>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded">Contact</button>
        </div>
      ))}
    </div>
  );
}
