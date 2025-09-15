// ReputationGraph.tsx
import { Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export default function ReputationGraph({ data }: { data: any[] }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <h4 className="font-semibold mb-2">Proof-of-Work Growth</h4>
      <LineChart width={300} height={200} data={data}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#4f46e5" />
      </LineChart>
    </div>
  );
}
