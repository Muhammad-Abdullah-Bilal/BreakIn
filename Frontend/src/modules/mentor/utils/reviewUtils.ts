/**
 * Format a review status for display
 */
export function formatReviewStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * Calculate average score from feedback components
 */
export function calculateAverageScore(scores: Record<string, number>): number {
  if (!scores || Object.keys(scores).length === 0) {
    return 0;
  }
  
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  return total / Object.keys(scores).length;
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Calculate weighted score based on rubric weights
 */
export function calculateWeightedScore(
  scores: Record<string, number>,
  weights: Record<string, number>
): number {
  if (!scores || Object.keys(scores).length === 0) {
    return 0;
  }
  
  let weightedTotal = 0;
  let weightSum = 0;
  
  for (const key in scores) {
    if (weights[key]) {
      weightedTotal += scores[key] * weights[key];
      weightSum += weights[key];
    }
  }
  
  return weightSum > 0 ? weightedTotal / weightSum : 0;
}

/**
 * Anonymize a name for blind reviews
 */
export function anonymizeName(name: string): string {
  return `User-${name.slice(0, 2).toUpperCase()}${Math.floor(Math.random() * 1000)}`;
}
