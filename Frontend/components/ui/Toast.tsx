'use client';

// Re-export ToastContainer from ToastProvider for convenience
export { ToastContainer } from '@/providers/ToastProvider';

// Individual Toast component for manual use
export { useToast } from '@/providers/ToastProvider';

// This file serves as the main export point for toast functionality
// All toast logic is implemented in the ToastProvider