// MentorProfilePage: mentor personal profile & stats

const MOCK_PROFILE = {
  name: "Jane Mentor",
  reviewsDone: 42,
  avgAccuracy: 97,
  reputation: 4.8,
  badges: ["Top Reviewer", "Calibrated"],
  available: true,
};

export default function MentorProfilePage() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Mentor Profile</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="text-lg font-semibold">{MOCK_PROFILE.name}</div>
        <div>Reviews done: {MOCK_PROFILE.reviewsDone}</div>
        <div>Avg. rating accuracy: {MOCK_PROFILE.avgAccuracy}%</div>
        <div>Reputation score: {MOCK_PROFILE.reputation}</div>
        <div>
          Badges: {MOCK_PROFILE.badges.map((b) => (
            <span key={b} className="inline-block bg-indigo-100 text-indigo-700 px-2 py-1 rounded mr-2 text-xs">{b}</span>
          ))}
        </div>
        <div>
          Availability: <span className={MOCK_PROFILE.available ? "text-green-600" : "text-red-600"}>{MOCK_PROFILE.available ? "Open" : "Closed"}</span>
        </div>
      </div>
    </div>
  );
}
