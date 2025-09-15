// formatter.ts
export function prettyNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
  return num.toString();
}

export function badge(type: string): string {
  switch (type) {
    case 'win': return '🏆';
    case 'mentor': return '🧑‍🏫';
    case 'squad': return '👥';
    default: return '🔹';
  }
}
