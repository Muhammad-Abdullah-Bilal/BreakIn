"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, Lock, Mail, User, Code2, Briefcase, GraduationCap } from "lucide-react";
import React, { useState } from "react";

type LoadingState = 'idle' | 'loading' | 'oauth';
type SelectableRole = 'developer' | 'employer' | 'mentor';

export default function SignUpPage() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [role, setRole] = useState<SelectableRole>("developer");
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);

  const { signUp, signIn } = useAuth();

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading('loading');
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading('idle');
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setLoading('idle');
      return;
    }

    try {
      await signUp(email, password, { displayName: name, role });
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during registration.');
    } finally {
      setLoading('idle');
    }
  };

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setLoading('oauth');
    setError(null);
    
    try {
      // Mock OAuth sign-in for development
      const mockEmail = provider === 'google' ? 'user@gmail.com' : 'user@github.com';
      await signIn(mockEmail, 'oauth-password');
      setError(null);
    } catch (err: any) {
      setError(`${provider} sign-in failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setLoading('idle');
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading('loading');
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      setLoading('idle');
      return;
    }

    try {
      await signIn(email, password);
      setError(null);
      // Redirect will be handled by auth provider
    } catch (err: any) {
      setError(err?.message || 'Login failed');
    } finally {
      setLoading('idle');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-center relative p-4 overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

      <div className="z-10 w-full max-w-md p-8">
        <Card className="bg-black/90 backdrop-blur-sm border-gray-800">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">Welcome to BreakIn</CardTitle>
            <CardDescription className="text-gray-400">
              The platform where developers find their next opportunity
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* Error Alert */}
            {error && (
              <Alert className="mb-4 bg-red-900/20 border-red-800">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tabs for Login/Register */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")} className="mb-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                <TabsTrigger value="login" className="data-[state=active]:bg-gray-700">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-gray-700">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                {/* OAuth Buttons for Login */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={loading !== 'idle'}
                  >
                    {loading === 'oauth' ? 'Redirecting...' : 'Continue with Google'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('github')}
                    disabled={loading !== 'idle'}
                  >
                    {loading === 'oauth' ? 'Redirecting...' : 'Continue with GitHub'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-gray-300">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email address
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                      required
                      disabled={loading !== 'idle'}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-gray-300">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 pr-10"
                        required
                        disabled={loading !== 'idle'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={loading !== 'idle'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={loading !== 'idle'}>
                    {loading === 'loading' ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">

                {/* OAuth Buttons for Registration */}
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('google')}
                    disabled={loading !== 'idle'}
                  >
                    {loading === 'oauth' ? 'Redirecting...' : 'Continue with Google'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOAuthSignIn('github')}
                    disabled={loading !== 'idle'}
                  >
                    {loading === 'oauth' ? 'Redirecting...' : 'Continue with GitHub'}
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-black px-2 text-gray-400">Or continue with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  {/* Full Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-gray-300">
                      <User className="w-4 h-4 inline mr-2" />
                      Full Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                      required
                      disabled={loading !== 'idle'}
                    />
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                      required
                      disabled={loading !== 'idle'}
                    />
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-300">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 pr-10"
                        required
                        disabled={loading !== 'idle'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={loading !== 'idle'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-gray-300">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-900 border-gray-700 text-white placeholder-gray-500 pr-10"
                        required
                        disabled={loading !== 'idle'}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={loading !== 'idle'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2 pt-1">
                    <Label className="text-gray-300 text-xs font-semibold uppercase tracking-wider">
                      Select Account Type
                    </Label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('developer')}
                        className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center text-center transition-all ${
                          role === 'developer'
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <Code2 className={`w-5 h-5 mb-1 ${role === 'developer' ? 'text-blue-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium">Developer</span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Build & Prove</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('employer')}
                        className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center text-center transition-all ${
                          role === 'employer'
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <Briefcase className={`w-5 h-5 mb-1 ${role === 'employer' ? 'text-blue-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium">Employer</span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Hire Talent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRole('mentor')}
                        className={`p-2.5 rounded-lg border text-left flex flex-col items-center justify-center text-center transition-all ${
                          role === 'mentor'
                            ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm shadow-blue-500/20'
                            : 'bg-gray-900/60 border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200'
                        }`}
                      >
                        <GraduationCap className={`w-5 h-5 mb-1 ${role === 'mentor' ? 'text-blue-400' : 'text-gray-400'}`} />
                        <span className="text-xs font-medium">Mentor</span>
                        <span className="text-[10px] text-gray-500 line-clamp-1">Review & Guide</span>
                      </button>
                    </div>
                  </div>

                  {/* Create Account Button */}
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white mt-2" disabled={loading !== 'idle'}>
                    {loading === 'loading' ? "Creating Account..." : "Create Account"}
                  </Button>

                  {/* Password requirements */}
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Password must be 8+ characters
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
