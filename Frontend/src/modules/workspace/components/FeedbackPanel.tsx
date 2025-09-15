// FeedbackPanel: inline mentor feedback

type Feedback = {
  mentor: string;
  comment: string;
  createdAt: string;
};

export function FeedbackPanel({ feedback }: { feedback: Feedback[] }) {
  return (
    <div className="mt-4">
      <h4 className="font-semibold mb-2">Mentor Feedback</h4>
      {feedback.length === 0 && <p className="text-gray-500 text-sm">No feedback yet.</p>}
      {feedback.map((fb, idx) => (
        <div key={idx} className="mb-2 p-2 border rounded bg-gray-50">
          <div className="text-xs text-gray-600">{fb.mentor} • {new Date(fb.createdAt).toLocaleString()}</div>
          <div className="text-sm">{fb.comment}</div>
        </div>
      ))}
    </div>
  );
}
