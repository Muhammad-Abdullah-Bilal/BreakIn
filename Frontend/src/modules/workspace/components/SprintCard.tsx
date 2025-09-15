// SprintCard: sprint preview
import type { Sprint } from "../types/sprint";
import { CountdownTimer } from "./CountdownTimer";

export function SprintCard({ sprint }: { sprint: Sprint }) {
  return (
    <div className="p-4 rounded-2xl shadow-md bg-white hover:shadow-lg mb-4">
      <h3 className="text-xl font-semibold">{sprint.title}</h3>
      <p className="text-sm text-gray-600">{sprint.description}</p>
      <div className="flex justify-between mt-2">
        <span className="text-xs text-gray-500">
          Deadline: {new Date(sprint.deadline).toLocaleDateString()}
        </span>
        <CountdownTimer deadline={sprint.deadline} />
      </div>
      <SubmissionUploader sprintId={sprint.id} />
    </div>
  );
}
// ...existing code...
import { SubmissionUploader } from "./SubmissionUploader";
