import { useRecruiterDashboard } from "../hooks/useRecruiterDashboard";
import RecruiterAnalyticsWidget from "../components/RecruiterAnalyticsWidget";
import MatchList from "../components/MatchList";
import CandidateCard from "../components/CandidateCard";

export default function RecruiterDashboardPage() {
  const { data, isLoading, error, matches, pipeline, openPositions } = useRecruiterDashboard();
  
  if (isLoading) return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 flex items-center justify-center h-64">
      <div role="status" className="text-center">
        <div className="w-12 h-12 border-t-2 border-b-2 border-indigo-600 rounded-full animate-spin mx-auto mb-2"></div>
        <span className="sr-only">Loading...</span>
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 text-center">
      <p className="text-red-500">Error loading dashboard: {error.message}</p>
      <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
        Retry
      </button>
    </div>
  );
  
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8" role="main" aria-label="Recruiter Dashboard">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Recruiter Dashboard</h1>
}
