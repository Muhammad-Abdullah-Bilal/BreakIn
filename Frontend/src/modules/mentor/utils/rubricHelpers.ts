// rubricHelpers: scoring logic helpers
export function calculateAverage(scores: number[]): number {
  if (!scores.length) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}
