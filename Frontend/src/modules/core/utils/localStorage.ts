/**
 * Save data to local storage
 * 
 * @param key Storage key
 * @param data Data to store
 */
export function saveToLocalStorage<T>(key: string, data: T): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving to localStorage: ${error}`);
  }
}

/**
 * Get data from local storage
 * 
 * @param key Storage key
 * @param defaultValue Default value if key doesn't exist
 * @returns The stored data or defaultValue if not found
 */
export function getFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined') return defaultValue;
    
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error getting from localStorage: ${error}`);
    return defaultValue;
  }
}

/**
 * Remove data from local storage
 * 
 * @param key Storage key
 */
export function removeFromLocalStorage(key: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage: ${error}`);
  }
}

/**
 * Clear all data from local storage
 */
export function clearLocalStorage(): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.clear();
  } catch (error) {
    console.error(`Error clearing localStorage: ${error}`);
  }
}
