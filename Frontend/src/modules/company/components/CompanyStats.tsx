// CompanyStats: metrics (time-to-hire, candidate pool health)

type CompanyStatsProps = {
  stats: {
    avgReadiness: number;
    responseTime: string;
    timeToHire: string;
    candidatePool: number;
  };
};

export function CompanyStats({ stats }: CompanyStatsProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-6 flex gap-8">
      <div>
        <div className="text-xs text-gray-500">Avg Readiness</div>
        <div className="font-bold text-lg">{stats.avgReadiness}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Response Time</div>
        <div className="font-bold text-lg">{stats.responseTime}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Time to Hire</div>
        <div className="font-bold text-lg">{stats.timeToHire}</div>
      </div>
      <div>
        <div className="text-xs text-gray-500">Candidate Pool</div>
        <div className="font-bold text-lg">{stats.candidatePool}</div>
      </div>
    </div>
  );
}
