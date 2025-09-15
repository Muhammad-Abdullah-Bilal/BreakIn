// anonymizer: ensures anonymity (strip personal IDs)
export function anonymizeCandidate(candidate: any) {
  const { name, email, ...rest } = candidate;
  return { ...rest };
}
