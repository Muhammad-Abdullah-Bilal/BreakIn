import SquadCard from "../components/SquadCard";
import { useSquads } from "../hooks/useSquads";

export default function SquadViewPage() {
  const { data: squads, isLoading } = useSquads();
  if (isLoading) return <div>Loading squads...</div>;
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h2 className="text-2xl font-bold mb-4">👥 Squads</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {squads?.map((squad: any) => <SquadCard key={squad.id} squad={squad} />)}
      </div>
    </div>
  );
}
