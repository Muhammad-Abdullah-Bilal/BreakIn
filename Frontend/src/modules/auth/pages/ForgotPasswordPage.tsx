'use client';

import ForgotPasswordForm from "../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  function handleForgot(data: any) {
    // TODO: Integrate with API
    alert(`Reset link sent to: ${data.email}`);
  }
  return (
    <div className="max-w-sm mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">Forgot Password</h1>
      <ForgotPasswordForm onSubmit={handleForgot} />
    </div>
  );
}
