import CandidateCard from "../components/CandidateCard";
import { useCandidateSearch } from "../hooks/useCandidateSearch";

export default function CandidateSearchPage() {
  const { results, isLoading } = useCandidateSearch();
  if (isLoading) return <div>Searching...</div>;
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Candidate Search</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((r: any) => <CandidateCard key={r.id} candidate={r} />)}
      </div>
    </div>
  );
}
