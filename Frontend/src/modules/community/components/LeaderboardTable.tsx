// LeaderboardTable.tsx
export default function LeaderboardTable({ data }: { data: any[] }) {
  return (
    <table className="min-w-full bg-white rounded-xl shadow">
      <thead>
        <tr>
          <th className="px-4 py-2">Rank</th>
          <th className="px-4 py-2">Name</th>
          <th className="px-4 py-2">Score</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={row.id} className="border-t">
            <td className="px-4 py-2">{i + 1}</td>
            <td className="px-4 py-2">{row.name}</td>
            <td className="px-4 py-2">{row.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
