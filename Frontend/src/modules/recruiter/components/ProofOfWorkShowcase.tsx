export default function ProofOfWorkShowcase({ projects }: { projects: any[] }) {
  if (!projects || !projects.length) return <div className="text-gray-500">No projects yet.</div>;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {projects.map((p) => (
        <div key={p.id} className="bg-white rounded-xl shadow p-4">
          <div className="font-semibold">{p.title}</div>
          <div className="text-sm text-gray-600">{p.description}</div>
        </div>
      ))}
    </div>
  );
}
