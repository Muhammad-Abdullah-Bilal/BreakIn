// ProgressSteps: onboarding progress UI
export function ProgressSteps({ current, total }: { current: number; total: number }) {
  return <div>Step {current} of {total}</div>;
}
