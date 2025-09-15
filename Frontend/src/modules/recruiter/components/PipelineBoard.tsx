export default function PipelineBoard() {
  const STAGES = ['Shortlist', 'Interview', 'Offer', 'Hired'];
  const MOCK = {
    Shortlist: [{ id: 'c1', name: 'Anon Dev' }],
    Interview: [{ id: 'c2', name: 'Candidate 2'}],
    Offer: [],
    Hired: [],
  };
  return (
    <div className="flex gap-4 overflow-x-auto">
      {STAGES.map(stage => (
        <div key={stage} className="min-w-[220px] bg-gray-50 rounded-xl p-3">
          <div className="font-semibold mb-2">{stage}</div>
          <div className="space-y-2">
            {(MOCK as any)[stage].map((c: any) => (
              <div key={c.id} className="p-2 bg-white rounded shadow">{c.name}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
