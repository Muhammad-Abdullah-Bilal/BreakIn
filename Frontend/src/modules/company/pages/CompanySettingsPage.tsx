// CompanySettingsPage: org profile, recruiter accounts, preferences

const MOCK_ORG = {
  name: "Acme Corp",
  recruiters: [
    { id: "r1", name: "Alice Recruiter", email: "alice@acme.com" },
    { id: "r2", name: "Bob Talent", email: "bob@acme.com" },
  ],
  preferences: {
    focus: "Juniors",
    matching: "Emerging Squads",
  },
};

export default function CompanySettingsPage() {
  return (
    <div className="max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Company Settings</h1>
      <div className="bg-white rounded-xl shadow p-6 space-y-3">
        <div className="text-lg font-semibold">{MOCK_ORG.name}</div>
        <div>
          <div className="font-medium mb-1">Recruiter Accounts:</div>
          <ul className="list-disc ml-6">
            {MOCK_ORG.recruiters.map((r) => (
              <li key={r.id}>{r.name} ({r.email})</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="font-medium mb-1">Preferences:</div>
          <div>Focus: {MOCK_ORG.preferences.focus}</div>
          <div>Matching: {MOCK_ORG.preferences.matching}</div>
        </div>
      </div>
    </div>
  );
}
