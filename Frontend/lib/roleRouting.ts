// Role-based routing and authorization utility
export type PrimaryRole = 'developer' | 'employer' | 'mentor' | 'admin';
export type UserRole = PrimaryRole | 'junior' | 'recruiter' | 'candidate' | 'company' | 'company_admin' | 'super_admin';

/**
 * Normalize any role alias to one of the 4 standard primary roles
 */
export function normalizeRole(role?: string | null): PrimaryRole {
  if (!role) return 'developer';
  const r = role.toLowerCase().trim();
  
  if (r === 'admin' || r === 'super_admin') {
    return 'admin';
  }
  if (r === 'mentor') {
    return 'mentor';
  }
  if (
    r === 'employer' ||
    r === 'recruiter' ||
    r === 'company' ||
    r === 'company_admin' ||
    r === 'hiring_manager' ||
    r === 'hr_specialist'
  ) {
    return 'employer';
  }
  
  // Default to developer for junior, candidate, developer, user, etc.
  return 'developer';
}

/**
 * Get human-readable title for a role
 */
export function getRoleLabel(role?: string | null): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return 'Administrator';
    case 'mentor':
      return 'Mentor';
    case 'employer':
      return 'Employer';
    case 'developer':
    default:
      return 'Developer';
  }
}

/**
 * Get the appropriate dashboard route based on user role
 */
export function getRoleDashboardRoute(role?: string | null): string {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'admin':
      return '/admin';
    case 'mentor':
      return '/mentor';
    case 'employer':
      return '/company-dashboard';
    case 'developer':
    default:
      return '/developer-dashboard';
  }
}

/**
 * Get the home route for a user based on their role
 * Used for logo clicks, home buttons, etc.
 */
export function getHomeRoute(role?: string | null): string {
  return getRoleDashboardRoute(role);
}

/**
 * Check whether a user's role satisfies the allowed roles list
 */
export function isRoleAllowed(userRole: string | undefined | null, allowedRoles: (PrimaryRole | UserRole)[]): boolean {
  if (!userRole) return false;
  const norm = normalizeRole(userRole);
  const normalizedAllowed = allowedRoles.map(r => normalizeRole(r));
  return normalizedAllowed.includes(norm);
}