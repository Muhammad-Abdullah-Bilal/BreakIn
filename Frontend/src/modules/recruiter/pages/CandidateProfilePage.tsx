import ProofOfWorkShowcase from "../components/ProofOfWorkShowcase";

export default function CandidateProfilePage() {
  // simple mock usage - in app router you'd use params
  const candidate = { id: "c1", name: "Anon Dev", bio: "Passionate junior dev", projects: [] };
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">{candidate.name}</h1>
      <p className="text-gray-600 mb-6">{candidate.bio}</p>
      <ProofOfWorkShowcase projects={candidate.projects} />
    </div>
  );
}
