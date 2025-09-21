// Role-based routing utility
export type UserRole = 'junior' | 'mentor' | 'recruiter' | 'admin';

/**
 * Get the appropriate dashboard route based on user role
 */
export function getRoleDashboardRoute(role: UserRole | undefined): string {
  switch (role) {
    case 'mentor':
      return '/mentor';
    case 'junior':
      return '/developer-dashboard';
    case 'recruiter':
      return '/company-dashboard';
    case 'admin':
      return '/admin';
    default:
      return '/developer-dashboard'; // Default fallback
  }
}

/**
 * Get the home route for a user based on their role
 * This is used for logo clicks, home buttons, etc.
 */
export function getHomeRoute(role: UserRole | undefined): string {
  return getRoleDashboardRoute(role);
}