"use client";

import { useState } from "react";

const steps = [
  { label: "Welcome", content: <div>Welcome to BreakIn! Let's get you set up.</div> },
  { label: "Profile", content: <div>Fill in your profile details (coming soon).</div> },
  { label: "Preferences", content: <div>Set your preferences (coming soon).</div> },
  { label: "Done", content: <div>You're all set! 🎉</div> },
];

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  function next() { setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function prev() { setStep((s) => Math.max(s - 1, 0)); }
  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Onboarding</h1>
      <div className="mb-4 font-semibold">Step {step + 1} of {steps.length}: {steps[step].label}</div>
      <div className="mb-8">{steps[step].content}</div>
      <div className="flex gap-2">
        <button onClick={prev} disabled={step === 0} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        <button onClick={next} disabled={step === steps.length - 1} className="px-4 py-2 bg-indigo-600 text-white rounded">Next</button>
      </div>
    </div>
  );
}
