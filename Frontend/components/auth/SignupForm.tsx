'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/lib/services/identity-api';
import { SignupCredentials, UserRole } from '@/lib/types/auth';
import { useAuth } from '@/providers/AuthProvider';
import { useToast } from '@/hooks/useToast';
import { useAccessibility } from '@/lib/accessibility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  Github, 
  Mail,
  Loader2,
  AlertCircle,
  Code,
  Users,
  Building,
  Check,
  X
} from 'lucide-react';
import Link from 'next/link';

const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  role: z
    .enum(['junior', 'mentor', 'recruiter'] as const, {
      required_error: 'Please select your role',
    }),
  agreeToTerms: z
    .boolean()
    .refine((value) => value === true, {
      message: 'You must agree to the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

const roleOptions = [
  {
    value: 'junior' as UserRole,
    label: 'Junior Developer',
    description: 'Learn through hands-on projects and mentorship',
    icon: Code,
  },
  {
    value: 'mentor' as UserRole,
    label: 'Mentor',
    description: 'Guide and review junior developers',
    icon: Users,
  },
  {
    value: 'recruiter' as UserRole,
    label: 'Recruiter',
    description: 'Discover and hire talented developers',
    icon: Building,
  },
];

export function SignupForm({ onSuccess, className }: SignupFormProps) {
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const selectedRole = watch('role');
  const currentPassword = watch('password');

  // Password strength validation
  const getPasswordStrength = (password: string) => {
    const checks = [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Contains number', valid: /[0-9]/.test(password) },
    ];
    return checks;
  };

  const passwordChecks = currentPassword ? getPasswordStrength(currentPassword) : [];
  const passwordScore = passwordChecks.filter(check => check.valid).length;

  // Announce form errors to screen readers
  React.useEffect(() => {
    if (generalError) {
      announceToScreenReader(`Signup error: ${generalError}`, 'assertive');
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

  const signupMutation = useMutation({
    mutationFn: (credentials: SignupCredentials) => authService.signup(credentials),
    onSuccess: async (response) => {
      await login(response.user, response.session);
      
      announceToScreenReader(
        `Welcome to BreakIn! Your account has been created successfully. Redirecting to onboarding...`, 
        'polite'
      );
      
      toast({
        title: 'Welcome to BreakIn!',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });

      onSuccess?.();
      
      // Redirect to onboarding
      router.push('/onboarding');
    },
    onError: (error: any) => {
      console.error('Signup failed:', error);
      
      if (error.field) {
        setError(error.field as keyof SignupFormData, {
          message: error.message,
        });
        announceToScreenReader(`Signup error in ${error.field}: ${error.message}`, 'assertive');
      } else {
        const errorMessage = error.message || 'Signup failed. Please try again.';
        setGeneralError(errorMessage);
        announceToScreenReader(`Signup failed: ${errorMessage}`, 'assertive');
      }
    },
  });

  const handleOAuthSignup = async (provider: string) => {
    try {
      announceToScreenReader(`Starting ${provider} signup...`, 'polite');
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

  const onSubmit = (data: SignupFormData) => {
    setGeneralError('');
    clearErrors();
    announceToScreenReader('Creating your account, please wait...', 'polite');
    signupMutation.mutate(data);
  };

  const isLoading = isSubmitting || signupMutation.isPending;

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
            Create Account
          </CardTitle>
          <p className="text-sm text-accessible-muted">
            Join BreakIn to start your journey
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 p-mobile">
          {/* OAuth Buttons */}
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
            <Button
              variant="outline"
              className="btn-enhanced interactive w-full"
              onClick={() => handleOAuthSignup('github')}
              type="button"
              disabled={isLoading}
              {...createAriaAttributes({
                label: 'Sign up with GitHub',
                describedby: isLoading ? 'oauth-status' : undefined
              })}
            >
              <Github className="h-4 w-4 mr-2" />
              <span className={isMobile ? '' : 'hidden sm:inline'}>Sign up with </span>GitHub
            </Button>
            
            <Button
              variant="outline"
              className="btn-enhanced interactive w-full"
              onClick={() => handleOAuthSignup('google')}
              type="button"
              disabled={isLoading}
              {...createAriaAttributes({
                label: 'Sign up with Google',
                describedby: isLoading ? 'oauth-status' : undefined
              })}
            >
              <Mail className="h-4 w-4 mr-2" />
              <span className={isMobile ? '' : 'hidden sm:inline'}>Sign up with </span>Google
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
                Or create account with email
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

          {/* Signup Form */}
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-4 touch-spacing"
            {...createAriaAttributes({
              role: 'form',
              label: 'Create account form'
            })}
          >
            {/* Role Selection */}
            <div className="form-group">
              <Label 
                className="form-label required"
                {...createAriaAttributes({
                  required: true
                })}
              >
                I am a...
              </Label>
              <fieldset 
                className="grid grid-cols-1 gap-2"
                {...createAriaAttributes({
                  role: 'radiogroup',
                  label: 'Select your role',
                  invalid: !!errors.role,
                  describedby: errors.role ? 'role-error' : 'role-help'
                })}
              >
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedRole === option.value;
                  
                  return (
                    <label
                      key={option.value}
                      className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-all interactive ${
                        isSelected 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary ring-offset-2' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setValue('role', option.value);
                        }
                      }}
                      {...createAriaAttributes({
                        role: 'radio',
                        checked: isSelected,
                        describedby: `role-${option.value}-desc`
                      })}
                    >
                      <input
                        type="radio"
                        {...register('role')}
                        value={option.value}
                        className="sr-only"
                      />
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {option.label}
                        </p>
                        <p 
                          id={`role-${option.value}-desc`}
                          className="text-xs text-muted-foreground"
                        >
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </label>
                  );
                })}
              </fieldset>
              <p id="role-help" className="form-help">
                Choose the role that best describes your goals on the platform
              </p>
              {errors.role && (
                <div 
                  id="role-error" 
                  className="form-error"
                  {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors.role.message}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="form-group">
              <Label 
                htmlFor="name" 
                className="form-label required"
                {...createAriaAttributes({
                  required: true
                })}
              >
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                className={`input-enhanced no-zoom ${focusedField === 'name' ? 'ring-2 ring-primary' : ''} ${errors.name ? 'border-destructive' : ''}`}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                {...register('name')}
                {...createAriaAttributes({
                  invalid: !!errors.name,
                  describedby: errors.name ? 'name-error' : 'name-help',
                  required: true
                })}
              />
              <p id="name-help" className="form-help">
                Enter your full name as you'd like it to appear on your profile
              </p>
              {errors.name && (
                <div 
                  id="name-error" 
                  className="form-error"
                  {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors.name.message}
                </div>
              )}
            </div>

            {/* Email */}
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
                  describedby: errors.email ? 'email-error' : 'email-help',
                  required: true
                })}
              />
              <p id="email-help" className="form-help">
                We'll use this email for account verification and notifications
              </p>
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

            {/* Password */}
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
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`input-enhanced no-zoom pr-12 ${focusedField === 'password' ? 'ring-2 ring-primary' : ''} ${errors.password ? 'border-destructive' : ''}`}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  {...register('password')}
                  {...createAriaAttributes({
                    invalid: !!errors.password,
                    describedby: errors.password ? 'password-error password-strength' : 'password-strength',
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
              
              {/* Password Strength Indicator */}
              {currentPassword && (
                <div 
                  id="password-strength"
                  className="space-y-2 mt-2"
                  {...createAriaAttributes({ live: 'polite' })}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Password strength:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 w-4 rounded-full ${
                            level <= passwordScore
                              ? passwordScore <= 2
                                ? 'bg-destructive'
                                : passwordScore === 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {passwordScore <= 2 ? 'Weak' : passwordScore === 3 ? 'Good' : 'Strong'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {passwordChecks.map((check, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {check.valid ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={check.valid ? 'text-green-600' : 'text-muted-foreground'}>
                          {check.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
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

            {/* Confirm Password */}
            <div className="form-group">
              <Label 
                htmlFor="confirmPassword" 
                className="form-label required"
                {...createAriaAttributes({
                  required: true
                })}
              >
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  className={`input-enhanced no-zoom pr-12 ${focusedField === 'confirmPassword' ? 'ring-2 ring-primary' : ''} ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  {...register('confirmPassword')}
                  {...createAriaAttributes({
                    invalid: !!errors.confirmPassword,
                    describedby: errors.confirmPassword ? 'confirm-password-error' : 'confirm-password-help',
                    required: true
                  })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-ring"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  {...createAriaAttributes({
                    label: showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation',
                    pressed: showConfirmPassword
                  })}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p id="confirm-password-help" className="form-help">
                Re-enter your password to confirm it matches
              </p>
              {errors.confirmPassword && (
                <div 
                  id="confirm-password-error" 
                  className="form-error"
                  {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                >
                  <AlertCircle className="h-4 w-4" />
                  {errors.confirmPassword.message}
                </div>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="form-group">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="agreeToTerms"
                  className={`h-5 w-5 mt-0.5 ${errors.agreeToTerms ? 'border-destructive' : ''}`}
                  {...register('agreeToTerms')}
                  {...createAriaAttributes({
                    invalid: !!errors.agreeToTerms,
                    describedby: errors.agreeToTerms ? 'terms-error' : 'terms-help',
                    required: true
                  })}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="agreeToTerms" className="text-sm cursor-pointer">
                    I agree to the{' '}
                    <Link 
                      href="/terms" 
                      className="text-primary hover:underline focus-ring rounded px-1 py-0.5"
                      {...createAriaAttributes({
                        label: 'Read Terms of Service (opens in new tab)'
                      })}
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      href="/privacy" 
                      className="text-primary hover:underline focus-ring rounded px-1 py-0.5"
                      {...createAriaAttributes({
                        label: 'Read Privacy Policy (opens in new tab)'
                      })}
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                  </Label>
                  <p id="terms-help" className="form-help">
                    Required to create your account and use our platform
                  </p>
                  {errors.agreeToTerms && (
                    <div 
                      id="terms-error" 
                      className="form-error"
                      {...createAriaAttributes({ role: 'alert', live: 'polite' })}
                    >
                      <AlertCircle className="h-4 w-4" />
                      {errors.agreeToTerms.message}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="btn-enhanced w-full interactive"
              disabled={isLoading}
              {...createAriaAttributes({
                describedby: isLoading ? 'signup-status' : undefined
              })}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </span>
              )}
            </Button>
            
            {isLoading && (
              <div 
                id="signup-status" 
                className="sr-only"
                {...createAriaAttributes({ live: 'polite' })}
              >
                Creating your account, please wait...
              </div>
            )}
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm">
            <span className="text-accessible-muted">Already have an account? </span>
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium focus-ring rounded px-1 py-0.5"
              {...createAriaAttributes({
                label: 'Sign in to your existing account'
              })}
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const signupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
  role: z
    .enum(['junior', 'mentor', 'recruiter'] as const, {
      required_error: 'Please select your role',
    }),
  agreeToTerms: z
    .boolean()
    .refine((value) => value === true, {
      message: 'You must agree to the terms and conditions',
    }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type SignupFormData = z.infer<typeof signupSchema>;

interface SignupFormProps {
  onSuccess?: () => void;
  className?: string;
}

const roleOptions = [
  {
    value: 'junior' as UserRole,
    label: 'Junior Developer',
    description: 'Learn through hands-on projects and mentorship',
    icon: Code,
  },
  {
    value: 'mentor' as UserRole,
    label: 'Mentor',
    description: 'Guide and review junior developers',
    icon: Users,
  },
  {
    value: 'recruiter' as UserRole,
    label: 'Recruiter',
    description: 'Discover and hire talented developers',
    icon: Building,
  },
];

export function SignupForm({ onSuccess, className }: SignupFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generalError, setGeneralError] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      agreeToTerms: false,
    },
  });

  const selectedRole = watch('role');

  const signupMutation = useMutation({
    mutationFn: (credentials: SignupCredentials) => authService.signup(credentials),
    onSuccess: async (response) => {
      await login(response.user, response.session);
      
      toast({
        title: 'Welcome to BreakIn!',
        description: 'Your account has been created successfully.',
        variant: 'default',
      });

      onSuccess?.();
      
      // Redirect to onboarding
      router.push('/onboarding');
    },
    onError: (error: any) => {
      console.error('Signup failed:', error);
      
      if (error.field) {
        setError(error.field as keyof SignupFormData, {
          message: error.message,
        });
      } else {
        setGeneralError(error.message || 'Signup failed. Please try again.');
      }
    },
  });

  const handleOAuthSignup = async (provider: string) => {
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

  const onSubmit = (data: SignupFormData) => {
    setGeneralError('');
    clearErrors();
    signupMutation.mutate(data);
  };

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card>
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground">
            Join BreakIn to start your journey
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignup('github')}
              type="button"
            >
              <Github className="h-4 w-4 mr-2" />
              Sign up with GitHub
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOAuthSignup('google')}
              type="button"
            >
              <Mail className="h-4 w-4 mr-2" />
              Sign up with Google
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or create account with email
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

          {/* Signup Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label>I am a...</Label>
              <div className="grid grid-cols-1 gap-2">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  const isSelected = selectedRole === option.value;
                  
                  return (
                    <div
                      key={option.value}
                      className={`relative flex items-center space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => setValue('role', option.value)}
                    >
                      <input
                        type="radio"
                        {...register('role')}
                        value={option.value}
                        className="sr-only"
                      />
                      <IconComponent className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {option.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {errors.role && (
                <p className="text-sm text-destructive">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                {...register('name')}
                className={errors.name ? 'border-destructive' : ''}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
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

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className={`pr-10 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                  aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p id="confirm-password-error" className="text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                {...register('agreeToTerms')}
                className={errors.agreeToTerms ? 'border-destructive' : ''}
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="agreeToTerms" className="text-sm">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
                {errors.agreeToTerms && (
                  <p className="text-sm text-destructive">
                    {errors.agreeToTerms.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || signupMutation.isPending}
            >
              {isSubmitting || signupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link
              href="/auth/login"
              className="text-primary hover:underline font-medium"
            >
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}