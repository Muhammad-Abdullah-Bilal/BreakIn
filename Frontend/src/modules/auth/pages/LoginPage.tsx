'use client';

import LoginForm from "../components/LoginForm";
import { useAuth } from "@/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(data: any) {
    try {
      setError(null);
      await signIn(data.email, data.password);
      // signIn handles role-based redirection
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    }
  }

  return (
    <div className="max-w-sm mx-auto py-12 text-slate-100">
      <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 text-sm p-3 rounded mb-4">
          {error}
        </div>
      )}
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
