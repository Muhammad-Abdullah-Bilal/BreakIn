import ProfileHeader from "../components/ProfileHeader";
import ReputationGraph from "../components/ReputationGraph";
import { useReputation } from "../hooks/useReputation";

const mockMentor = {
  avatar: "/public/placeholder-user.jpg",
  name: "Mentor Jane",
  tagline: "Mentor | 30 reviews given"
};

export default function MentorProfilePage() {
  const { data: repData, isLoading } = useReputation("mentor-1");
  return (
    <div className="max-w-xl mx-auto py-8">
      <ProfileHeader profile={mockMentor} />
      <h3 className="font-semibold mb-2">Mentor Impact Graph</h3>
      {isLoading ? <div>Loading graph...</div> : <ReputationGraph data={repData || []} />}
    </div>
  );
}
