'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/lib/services/identity-api';
import { LoginCredentials } from '@/lib/types/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { useAccessibility } from '@/lib/accessibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  Github, 
  Mail,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ redirectPath, onSuccess, className }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const { 
    createAriaAttributes, 
    announceToScreenReader, 
    useReducedMotion,
    useResponsiveBreakpoint 
  } = useAccessibility();
  
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const reducedMotion = useReducedMotion();
  const isMobile = useResponsiveBreakpoint('sm');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  // Announce form errors to screen readers
  React.useEffect(() => {
    if (generalError) {
      announceToScreenReader(`Login error: ${generalError}`, 'assertive');
    }
  }, [generalError, announceToScreenReader]);

  React.useEffect(() => {
    const firstError = Object.keys(errors)[0];
    if (firstError && errors[firstError as keyof typeof errors]) {
      announceToScreenReader(
        `Form validation error in ${firstError}: ${errors[firstError as keyof typeof errors]?.message}`,
        'assertive'
      );
    }
  }, [errors, announceToScreenReader]);

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (response) => {
      await login(response.user, response.session);
      
      announceToScreenReader(
        `Successfully signed in as ${response.user.name}. Redirecting...`, 
        'polite'
      );
      
      toast({
        title: 'Welcome back!',
        description: `Logged in successfully as ${response.user.name}`,
        variant: 'default',
      });

      onSuccess?.();
      
      // Redirect to intended path or role-based home
      const targetPath = redirectPath || getRoleBasedHomePath(response.user.role);
      router.push(targetPath);
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      
      if (error.field) {
        setError(error.field as keyof LoginFormData, {
          message: error.message,
        });
        announceToScreenReader(`Login error in ${error.field}: ${error.message}`, 'assertive');
      } else {
        const errorMessage = error.message || 'Login failed. Please try again.';
        setGeneralError(errorMessage);
        announceToScreenReader(`Login failed: ${errorMessage}`, 'assertive');
      }
    },
  });

  const handleOAuthLogin = async (provider: string) => {
    try {
      announceToScreenReader(`Starting ${provider} authentication...`, 'polite');
      const response = await authService.oauthStart(provider);
      announceToScreenReader(`Redirecting to ${provider} for authentication...`, 'polite');
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to start OAuth flow';
      announceToScreenReader(`OAuth error: ${errorMessage}`, 'assertive');
      toast({
        title: 'OAuth Error',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setGeneralError('');
    clearErrors();
    announceToScreenReader('Signing in, please wait...', 'polite');
    loginMutation.mutate(data);
  };

  const getRoleBasedHomePath = (role: string): string => {
    switch (role) {
      case 'junior':
        return '/developer-dashboard';
      case 'mentor':
        return '/mentor';
      case 'recruiter':
        return '/company-dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const isLoading = isSubmitting || loginMutation.isPending;

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card className="card-enhanced">
        <CardHeader className="space-y-1 text-center p-mobile">
          <CardTitle 
            className="text-2xl font-bold"
            {...createAriaAttributes({
              level: 1,
              role: 'heading'
            })}
          >
            Sign In
          </CardTitle>
          <p className="text-sm text-accessible-muted">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 p-mobile">
          {/* OAuth Buttons */}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <Button
              variant="outline"
              className="btn-enhanced interactive w-full"
              onClick={() => handleOAuthLogin('github')}
              type="button"
              disabled={isLoading}
              {...createAriaAttributes({
                label: 'Sign in with GitHub',
                describedby: isLoading ? 'oauth-status' : undefined
              })}
            >
              <Github className="h-4 w-4 mr-2" />
              <span className={isMobile ? '' : 'hidden sm:inline'}>Continue with </span>GitHub
            </Button>
            
            <Button
              variant="outline"
              className="btn-enhanced interactive w-full"
              onClick={() => handleOAuthLogin('google')}
              type="button"
              disabled={isLoading}
              {...createAriaAttributes({
                label: 'Sign in with Google',
                describedby: isLoading ? 'oauth-status' : undefined
              })}
            >
              <Mail className="h-4 w-4 mr-2" />
              <span className={isMobile ? '' : 'hidden sm:inline'}>Continue with </span>Google
            </Button>
          </div>

          {isLoading && (
            <div 
              id="oauth-status" 
              className="sr-only"
              {...createAriaAttributes({ live: 'polite' })}
            >
              Processing authentication...
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* General Error */}
          {generalError && (
            <Alert 
              variant="destructive" 
              {...createAriaAttributes({ role: 'alert', live: 'assertive' })}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-start gap-2">
                <span>{generalError}</span>
              </AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4 touch-spacing"
            {...createAriaAttributes({
              role: 'form',
              label: 'Sign in form'
            })}
          >
            <div className="form-group">
              <Label 
                htmlFor="email" 
                className="form-label required"
                {...createAriaAttributes({
                  required: true
                })}
              >
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                className={`input-enhanced no-zoom ${focusedField === 'email' ? 'ring-2 ring-primary' : ''} ${errors.email ? 'border-destructive' : ''}`}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                {...register('email')}
                {...createAriaAttributes({
                  invalid: !!errors.email,
                  describedby: errors.email ? 'email-error' : undefined,
                  required: true
                })}
              />
              {errors.email && (
                <div 
                  id="email-error" 
                  className="form-error"
                  {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors.email.message}
                </div>
              )}
            </div>

            <div className="form-group">
              <Label 
                htmlFor="password" 
                className="form-label required"
                {...createAriaAttributes({
                  required: true
                })}
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`input-enhanced no-zoom pr-12 ${focusedField === 'password' ? 'ring-2 ring-primary' : ''} ${errors.password ? 'border-destructive' : ''}`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  {...register('password')}
                  {...createAriaAttributes({
                    invalid: !!errors.password,
                    describedby: errors.password ? 'password-error password-help' : 'password-help',
                    required: true
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-ring"
                  onClick={() => setShowPassword(!showPassword)}
                  {...createAriaAttributes({
                    label: showPassword ? 'Hide password' : 'Show password',
                    pressed: showPassword
                  })}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p id="password-help" className="form-help">
                Password must be at least 8 characters long
              </p>
              {errors.password && (
                <div 
                  id="password-error" 
                  className="form-error"
                  {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors.password.message}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="rememberMe"
                  className="h-5 w-5"
                  {...register('rememberMe')}
                  {...createAriaAttributes({
                    describedby: 'remember-help'
                  })}
                />
                <Label htmlFor="rememberMe" className="text-sm cursor-pointer">
                  Remember me
                </Label>
              </div>
              
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline focus-ring rounded px-1 py-0.5"
                {...createAriaAttributes({
                  label: 'Reset your password if you forgot it'
                })}
              >
                Forgot password?
              </Link>
            </div>
            
            <p id="remember-help" className="form-help">
              Keep me signed in on this device for convenience
            </p>

            <Button
              type="submit"
              className="btn-enhanced w-full interactive"
              disabled={isLoading}
              {...createAriaAttributes({
                describedby: isLoading ? 'signin-status' : undefined
              })}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </span>
              )}
            </Button>
            
            {isLoading && (
              <div 
                id="signin-status" 
                className="sr-only"
                {...createAriaAttributes({ live: 'polite' })}
              >
                Signing in, please wait...
              </div>
            )}
          </form>

          {/* Sign Up Link */}
          <div className="text-center text-sm">
            <span className="text-accessible-muted">Don't have an account? </span>
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-medium focus-ring rounded px-1 py-0.5"
              {...createAriaAttributes({
                label: 'Create a new account'
              })}
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  redirectPath?: string;
  onSuccess?: () => void;
  className?: string;
}

export function LoginForm({ redirectPath, onSuccess, className }: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: async (response) => {
      await login(response.user, response.session);
      
      toast({
        title: 'Welcome back!',
        description: `Logged in successfully as ${response.user.name}`,
        variant: 'default',
      });

      onSuccess?.();
      
      // Redirect to intended path or role-based home
      const targetPath = redirectPath || getRoleBasedHomePath(response.user.role);
      router.push(targetPath);
    },
    onError: (error: any) => {
      console.error('Login failed:', error);
      
      if (error.field) {
        setError(error.field as keyof LoginFormData, {
          message: error.message,
        });
      } else {
        setGeneralError(error.message || 'Login failed. Please try again.');
      }
    },
  });

  const handleOAuthLogin = async (provider: string) => {
    try {
      const response = await authService.oauthStart(provider);
      window.location.href = response.redirectUrl;
    } catch (error: any) {
      toast({
        title: 'OAuth Error',
        description: error.message || 'Failed to start OAuth flow',
        variant: 'destructive',
      });
    }
  };

  const onSubmit = (data: LoginFormData) => {
    setGeneralError('');
    clearErrors();
    loginMutation.mutate(data);
  };

  const getRoleBasedHomePath = (role: string): string => {
    switch (role) {
      case 'junior':
        return '/developer-dashboard';
      case 'mentor':
        return '/mentor';
      case 'recruiter':
        return '/company-dashboard';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to access your account
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('github')}
              type="button"
            >
              <Github className="h-4 w-4 mr-2" />
              Continue with GitHub
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthLogin('google')}
              type="button"
            >
              <Mail className="h-4 w-4 mr-2" />
              Continue with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* General Error */}
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                autoComplete="email"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
                aria-describedby={errors.email ? 'email-error' : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-sm text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`pr-10 ${errors.password ? 'border-destructive' : ''}`}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...register('rememberMe')}
                />
                <Label htmlFor="rememberMe" className="text-sm">
                  Remember me
                </Label>
              </div>
              
              <Link
                href="/auth/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || loginMutation.isPending}
            >
              {isSubmitting || loginMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Don't have an account? </span>
            <Link
              href="/auth/signup"
              className="text-primary hover:underline font-medium"
            >
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}