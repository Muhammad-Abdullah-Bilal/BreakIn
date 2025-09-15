import ProfileHeader from "../components/ProfileHeader";
import ReputationGraph from "../components/ReputationGraph";
import { useReputation } from "../hooks/useReputation";

const mockProfile = {
  avatar: "/public/placeholder-user.jpg",
  name: "Anon Builder",
  tagline: "Proof > Résumé | 12-week streak!"
};

export default function UserProfilePage() {
  const { data: repData, isLoading } = useReputation("user-1");
  return (
    <div className="max-w-xl mx-auto py-8">
      <ProfileHeader profile={mockProfile} />
      <h3 className="font-semibold mb-2">Proof-of-Work Graph</h3>
      {isLoading ? <div>Loading graph...</div> : <ReputationGraph data={repData || []} />}
    </div>
  );
}
