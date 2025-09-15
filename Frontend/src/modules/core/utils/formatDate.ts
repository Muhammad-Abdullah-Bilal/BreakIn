/**
 * Formats a date string or Date object into a human-readable format
 * 
 * @param date The date to format
 * @param format The format to use (default: 'full')
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  format: 'full' | 'date' | 'time' | 'relative' | 'iso' = 'full'
): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  switch (format) {
    case 'full':
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'full',
        timeStyle: 'short'
      }).format(dateObj);
      
    case 'date':
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium'
      }).format(dateObj);
      
    case 'time':
      return new Intl.DateTimeFormat('en-US', {
        timeStyle: 'short'
      }).format(dateObj);
      
    case 'relative':
      return formatRelativeTime(dateObj);
      
    case 'iso':
      return dateObj.toISOString();
      
    default:
      return dateObj.toLocaleString();
  }
}

/**
 * Formats a date into a relative time string (e.g. "5 minutes ago")
 * 
 * @param date The date to format
 * @returns Relative time string
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);
  
  if (diffSeconds < 60) {
    return diffSeconds <= 1 ? 'just now' : `${diffSeconds} seconds ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 minute ago' : `${diffMinutes} minutes ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 30) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else if (diffMonths < 12) {
    return diffMonths === 1 ? '1 month ago' : `${diffMonths} months ago`;
  } else {
    return diffYears === 1 ? '1 year ago' : `${diffYears} years ago`;
  }
}
