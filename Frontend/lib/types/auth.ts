// Authentication and Identity Types
// Frozen contracts - PR required to change

export type UserRole = 'junior' | 'mentor' | 'recruiter' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  role: UserRole;
  name?: string;
  avatarUrl?: string;
  expiresAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  displayName: string;
  bio?: string;
  location?: string;
  website?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills: string[];
  preferences: ProfilePreferences;
  notificationSettings: NotificationSettings;
  privacySettings: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  emailDigest: 'daily' | 'weekly' | 'monthly' | 'never';
}

export interface NotificationSettings {
  email: {
    mentions: boolean;
    directMessages: boolean;
    submissions: boolean;
    reviews: boolean;
    communityActivity: boolean;
    systemUpdates: boolean;
  };
  push: {
    mentions: boolean;
    directMessages: boolean;
    submissions: boolean;
    reviews: boolean;
  };
  inApp: {
    mentions: boolean;
    directMessages: boolean;
    submissions: boolean;
    reviews: boolean;
    communityActivity: boolean;
  };
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'community' | 'private';
  showEmail: boolean;
  showLocation: boolean;
  showActivity: boolean;
  allowDirectMessages: boolean;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  type: 'achievement' | 'skill' | 'milestone' | 'special';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  criteria: string;
  earnedAt?: string;
}

export interface ReputationPoint {
  id: string;
  userId: string;
  points: number;
  reason: string;
  category: 'submission' | 'review' | 'community' | 'mentorship';
  referenceId?: string;
  createdAt: string;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  data?: Record<string, any>;
}

// Auth Forms
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupCredentials {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  agreeToTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordReset {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface EmailVerification {
  token: string;
}

// OAuth
export interface OAuthProvider {
  id: string;
  name: string;
  iconUrl: string;
  enabled: boolean;
}

export interface OAuthStartResponse {
  redirectUrl: string;
  state: string;
}

export interface OAuthCallbackData {
  code: string;
  state: string;
  provider: string;
}

// Auth State
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastLoginRedirect?: string;
}

// Auth Errors
export interface AuthError {
  code: string;
  message: string;
  field?: string;
}

// Route Guards
export interface RouteGuard {
  requiredRole?: UserRole[];
  requireAuth?: boolean;
  requireOnboarding?: boolean;
  redirectPath?: string;
}