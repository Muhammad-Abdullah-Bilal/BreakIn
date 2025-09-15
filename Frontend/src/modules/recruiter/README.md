# BreakIn Recruiter & Company Portal

This module provides all functionality for the recruiter and company portal within the BreakIn platform - where recruiters, hiring managers, and partner companies search, filter, evaluate, and engage with junior talent via proof-of-work.

## Architecture

- **pages/**: Page components for different recruiter views
- **components/**: Reusable UI components specific to recruiting
- **hooks/**: Custom hooks for data fetching, state management, etc.
- **services/**: API client functions for backend communication
- **store/**: Global state management using Zustand
- **tests/**: Unit and integration tests

## API Integration

All backend API calls are centralized in the `services/` directory. The services currently use mock data, but are structured to easily switch to real API endpoints once they're available.

To use a real API endpoint, simply uncomment the fetch code and comment out the mock data in each service function.

## Accessibility Features

This module follows WCAG 2.1 accessibility guidelines:

- All interactive elements have proper ARIA attributes and keyboard navigation
- Color contrast meets AA standards
- Mobile-responsive design with proper touch targets
- Screen reader friendly with semantic HTML

## Mobile Optimization

The UI is fully responsive with:

- Flexible layouts using CSS Grid and Flexbox
- Mobile-friendly touch targets (min 44x44px)
- Reduced data requirements for mobile networks
- Optimized for touch interactions

## Next Steps

- Wire `useCandidateSearch` to `recruiter.api.searchCandidates`
- Implement backend endpoints for job posting CRUD and pipeline updates
- Add more tests for hooks and components
- Add Storybook stories for UI components
