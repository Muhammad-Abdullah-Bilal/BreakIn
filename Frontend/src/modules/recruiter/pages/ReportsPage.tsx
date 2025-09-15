import RecruiterAnalyticsWidget from "../components/RecruiterAnalyticsWidget";
import { useReports } from "../hooks/useReports";

export default function ReportsPage() {
  const { data } = useReports();
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Reports</h1>
      <RecruiterAnalyticsWidget metrics={data.metrics} />
    </div>
  );
}
