// ProofBadge: badge for validated proof-of-work
export function ProofBadge({ verified }: any) {
  return <span>{verified ? 'Verified' : 'Unverified'}</span>;
}
