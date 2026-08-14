"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { Code2, Eye, EyeOff, Lock, Mail, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signIn } = useAuth();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      await signIn(email.trim(), password);
      // AuthProvider signIn automatically handles role-based routing
    } catch (e: any) {
      setErrorMessage(e?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-hidden p-4">
      {/* Ambient glow mesh */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-center w-full py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-2xl text-slate-100">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold flex items-center justify-center">
              <Code2 className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold text-white">BreakIn Direct</span>
            </CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-400">
              Sign in with your registered account to access your developer profile and technical sprints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-slate-950 border border-slate-800">
                <TabsTrigger value="login" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-300">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" asChild className="text-slate-300 hover:text-white">
                  <Link href="/auth/sign-up">Register</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {errorMessage && (
              <Alert className="mb-6 bg-red-950/60 border-red-800 text-red-200" variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertTitle>Authentication Error</AlertTitle>
                <AlertDescription className="text-xs">{errorMessage}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-slate-300 text-sm font-medium">Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-500"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="text-slate-300 text-sm font-medium">Password</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="pl-10 pr-10 bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-500 focus:ring-blue-500 placeholder:text-slate-500"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 shadow-lg shadow-blue-600/30 transition-all mt-2"
              >
                {loading ? "Verifying Credentials..." : "Sign In to Platform"}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-slate-400">
              Don't have an account yet?{" "}
              <Link href="/auth/sign-up" className="text-blue-400 font-semibold hover:underline">
                Create an account first
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
