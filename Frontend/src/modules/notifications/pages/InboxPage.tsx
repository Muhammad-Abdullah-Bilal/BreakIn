import RecruiterPingCard from "../components/RecruiterPingCard";

const MOCK_PINGS = [
  { id: 1, from: "Recruiter Jane", message: "Interested in your sprint!", time: "2m ago" },
  { id: 2, from: "Recruiter Bob", message: "Let's connect for a role.", time: "1h ago" },
];

export default function InboxPage() {
  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      {MOCK_PINGS.map((ping) => (
        <RecruiterPingCard key={ping.id} ping={ping} />
      ))}
    </div>
  );
}
