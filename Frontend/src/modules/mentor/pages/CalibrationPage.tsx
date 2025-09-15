// CalibrationPage: team calibration & scoring consistency

import { CalibrationChart } from "../components/CalibrationChart";

const MOCK_CALIBRATION = [
  { mentor: "mentor1", avgScore: 4.2, yourScore: 4.5 },
  { mentor: "mentor2", avgScore: 3.8, yourScore: 3.7 },
  { mentor: "mentor3", avgScore: 4.0, yourScore: 4.1 },
];

export default function CalibrationPage() {
  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Calibration</h1>
      <p className="mb-4 text-gray-600">Compare your scores with team averages.</p>
      <CalibrationChart data={MOCK_CALIBRATION} />
    </div>
  );
}
