export default function RecruiterAnalyticsWidget({ metrics }: { metrics: any }) {
  const m = metrics || { timeToHire: '12d', convRate: '4%', pipelineHealth: 'Good' };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mb-6">
      <div className="bg-white rounded-xl shadow p-4 transition-shadow hover:shadow-md" role="region" aria-label="Time to Hire Metric">
        <div className="text-sm text-gray-500 mb-1">Time to Hire</div>
        <div className="font-semibold text-lg">{m.timeToHire}</div>
        <div className="text-xs text-green-600 mt-1">↓ 2d from last month</div>
      </div>
      <div className="bg-white rounded-xl shadow p-4 transition-shadow hover:shadow-md" role="region" aria-label="Conversion Rate Metric">
        <div className="text-sm text-gray-500 mb-1">Conversion Rate</div>
        <div className="font-semibold text-lg">{m.convRate}</div>
        <div className="text-xs text-green-600 mt-1">↑ 1% from last month</div>
      </div>
      <div className="bg-white rounded-xl shadow p-4 transition-shadow hover:shadow-md" role="region" aria-label="Pipeline Health Metric">
        <div className="text-sm text-gray-500 mb-1">Pipeline Health</div>
        <div className="font-semibold text-lg flex items-center">
          {m.pipelineHealth}
          {m.pipelineHealth === 'Good' && (
            <span className="ml-1 text-green-500 text-sm">●</span>
          )}
          {m.pipelineHealth === 'Warning' && (
            <span className="ml-1 text-yellow-500 text-sm">●</span>
          )}
          {m.pipelineHealth === 'Alert' && (
            <span className="ml-1 text-red-500 text-sm">●</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">Based on 12 active positions</div>
      </div>
    </div>
  );
}
