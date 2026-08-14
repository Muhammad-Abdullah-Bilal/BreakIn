'use client';

import ResetPasswordForm from "../components/ResetPasswordForm";

export default function ResetPasswordPage() {
  function handleReset(data: any) {
    // TODO: Integrate with API
    alert(`Password reset: ${JSON.stringify(data)}`);
  }
  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      <ResetPasswordForm onSubmit={handleReset} />
    </div>
  );
}
