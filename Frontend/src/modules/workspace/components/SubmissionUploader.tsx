// SubmissionUploader: file/code upload

import { useState } from "react";
import { uploadSubmission } from "../services/submissions.api";

export function SubmissionUploader({ sprintId }: { sprintId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setSuccess(null);
    await uploadSubmission({ sprintId, file });
    setIsLoading(false);
    setSuccess(file.name);
  };

  return (
    <div className="p-3 border rounded-xl bg-gray-50 mt-3">
      <label className="text-sm font-medium">Upload your solution</label>
      <input type="file" onChange={handleFileChange} className="mt-2" />
      {isLoading && <p className="text-xs text-blue-500">Uploading...</p>}
      {success && <p className="text-xs text-green-600">Uploaded: {success}</p>}
    </div>
  );
}
