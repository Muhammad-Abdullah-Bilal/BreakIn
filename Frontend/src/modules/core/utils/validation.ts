/**
 * Validates if a string is a valid email address
 * 
 * @param email The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates if a string has a minimum length
 * 
 * @param value The string to validate
 * @param minLength The minimum length required
 * @returns True if the string meets the minimum length, false otherwise
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validates if a password meets strength requirements
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * 
 * @param password The password to validate
 * @returns True if the password meets the requirements, false otherwise
 */
export function isStrongPassword(password: string): boolean {
  if (password.length < 8) return false;
  
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumbers && hasSpecialChars;
}

/**
 * Validates if a URL is valid
 * 
 * @param url The URL to validate
 * @returns True if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Validates if a string is a valid phone number
 * Simple validation for international format: +[country code][number]
 * 
 * @param phone The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  // Basic validation for international format: +[country code][number]
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phone);
}
