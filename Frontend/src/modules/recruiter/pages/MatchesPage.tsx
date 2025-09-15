import MatchList from "../components/MatchList";

export default function MatchesPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">AI Matches</h1>
      <MatchList />
    </div>
  );
}
