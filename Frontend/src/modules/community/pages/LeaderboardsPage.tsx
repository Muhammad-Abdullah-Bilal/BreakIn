import LeaderboardTable from "../components/LeaderboardTable";
import { useLeaderboards } from "../hooks/useLeaderboards";

export default function LeaderboardsPage() {
  const { data: leaderboard, isLoading } = useLeaderboards();
  return (
    <div className="max-w-xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">🏆 Leaderboards</h2>
      {isLoading ? <div>Loading...</div> : <LeaderboardTable data={leaderboard || []} />}
    </div>
  );
}
