export function useCandidateSearch() {
  // TODO: wire to backend
  const results = [
    { id: 'c1', name: 'Anon Dev', proofScore: 88, track: 'Frontend', bio: 'Builds beautiful UIs' },
    { id: 'c2', name: 'Dev Two', proofScore: 92, track: 'Backend', bio: 'APIs & infra' },
  ];
  return { results, isLoading: false };
}
