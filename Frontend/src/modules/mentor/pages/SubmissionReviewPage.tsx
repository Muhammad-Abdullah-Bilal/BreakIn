// SubmissionReviewPage: detail view of one submission

import { CodeReviewPanel } from "../components/CodeReviewPanel";
import { FeedbackForm } from "../components/FeedbackForm";

const MOCK_CODE = `function add(a, b) {\n  return a + b;\n}`;
const MOCK_COMMENTS = [
  { line: 1, comment: "Consider adding input validation." },
  { line: 2, comment: "Good use of return statement." },
];

export default function SubmissionReviewPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Submission Review</h1>
      <CodeReviewPanel code={MOCK_CODE} comments={MOCK_COMMENTS} />
      <FeedbackForm submissionId="s1" />
    </div>
  );
}
