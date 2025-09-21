# Core App Shell - Implementation Documentation

## Overview

The Core App Shell provides foundational infrastructure for the BreakIn platform, serving as the single source of truth for layout, theme, authentication, query management, realtime communication, notifications, and observability.

## Architecture

### Provider Hierarchy

The provider composition follows strict ordering requirements per frozen contracts:

```
ErrorBoundary
└── ThemeProvider
    └── QueryClientProvider
        └── AuthProvider
            └── RealtimeProvider
                └── ToastProvider
                    └── ObservabilityProvider
                        └── App Content
```

## Components Implemented

### 1. App Shell & Layouts

#### `/app/layout.tsx`
- Root application layout with metadata
- Provider composition integration
- Navigation and skip-to-content accessibility
- Global font and viewport configuration

#### `/app/error.tsx`
- Enhanced error page with proper styling
- Error reporting integration
- Development/production error display modes
- User-friendly error recovery options

#### `/app/not-found.tsx`
- Branded 404 page with navigation options
- Consistent design system usage
- Clear call-to-action buttons

### 2. Global Providers

#### `/providers/AppProviders.tsx`
- Central provider composition
- React Query configuration with retry logic
- Development tools integration
- Global error boundary

#### `/providers/ThemeProvider.tsx`
- Dark/light/system theme support
- Theme persistence and sync
- Smooth theme transitions
- CSS custom properties integration

#### `/providers/AuthProvider.tsx`
- Authentication context and state management
- Token management and persistence
- User session handling
- Mock authentication for development

#### `/providers/RealtimeProvider.tsx`
- WebSocket connection management
- Channel-based pub/sub architecture
- Auto-reconnection and error handling
- Token-based authentication

#### `/providers/ToastProvider.tsx`
- Global toast notification system
- Accessibility-compliant notifications
- Customizable positioning and styling
- Action button support

#### `/providers/ObservabilityProvider.tsx`
- Performance monitoring integration
- Error tracking and reporting
- User interaction analytics
- Global error handling enhancement

### 3. Design System Baseline

#### Core UI Components (`/components/ui/`)

**Form Controls:**
- `Button.tsx` - Primary, secondary, outline, ghost, link variants
- `Input.tsx` - Text input with validation states
- `Select.tsx` - Dropdown select with search
- `Checkbox.tsx` - Styled checkbox component
- `Switch.tsx` - Toggle switch component
- `Textarea.tsx` - Multi-line text input

**Layout & Navigation:**
- `Card.tsx` - Container component with header/footer
- `Badge.tsx` - Status and categorization badges
- `Tabs.tsx` - Tabbed interface component

**Overlays & Dialogs:**
- `Dialog.tsx` - Modal dialog component
- `Toast.tsx` - Notification toast system

**Accessibility Features:**
- ARIA labels and descriptions
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast support

### 4. Notifications Module

#### Type Definitions (`/lib/types/notifications.ts`)
- Comprehensive notification type system
- Priority levels and metadata support
- Action-specific notification interfaces
- User preference definitions

#### Service Layer (`/lib/services/notification.ts`)
- RESTful API integration
- CRUD operations for notifications
- Preference management
- Bulk operations support

#### React Hooks (`/hooks/useNotifications.ts`)
- Real-time notification updates
- Optimistic UI updates
- Query invalidation strategies
- Error handling and retry logic

#### UI Components (`/components/notifications/`)
- `NotificationItem.tsx` - Individual notification display
- `NotificationList.tsx` - Notification management interface
- `NotificationBell.tsx` - Header notification indicator

### 5. Observability System

#### Logging (`/hooks/useLogger.ts`)
- Structured logging with context
- Multiple output targets (console, remote, Sentry)
- Log level filtering and buffering
- Automatic log flushing

#### Performance Monitoring (`/hooks/useObservability.ts`)
- Core Web Vitals tracking
- Custom performance metrics
- Execution time measurement
- Navigation timing analysis

#### User Interaction Tracking
- Click, scroll, navigation events
- Form submission tracking
- Error occurrence logging
- User journey analytics

#### Error Reporting
- Global error boundary integration
- Unhandled error capture
- Promise rejection handling
- Component stack traces

### 6. Core Layout Components

#### `/components/layout/Navigation.tsx`
- Responsive navigation component
- Role-based menu items
- Mobile-friendly hamburger menu
- Accessibility compliance

#### `/components/core/ErrorBoundary.tsx`
- Production-ready error boundaries
- Sentry integration for error reporting
- Development debugging tools
- User-friendly error fallbacks

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Optional - Observability
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_LOGGING_URL=/api/logs

# Optional - Theme
NEXT_PUBLIC_DEFAULT_THEME=system
```

### TypeScript Configuration

The app shell requires proper TypeScript configuration with:
- Path aliases (`@/` for absolute imports)
- JSX support for React components
- Strict mode for type safety

### Tailwind CSS

Design tokens and utilities are configured in:
- `tailwind.config.ts` - Theme customization
- `app/globals.css` - CSS custom properties and base styles

## Usage Patterns

### Provider Access

```typescript
// Theme management
const { theme, setTheme } = useTheme();

// Authentication
const { user, login, logout, isLoading } = useAuth();

// Real-time communication
const { subscribe, publish, isConnected } = useRealtime();

// Notifications
const { notifications, markAsRead, markAllAsRead } = useNotifications();

// Observability
const { trackCustomMetric, logError, trackInteraction } = useObservabilityContext();
```

### Component Patterns

```typescript
// UI component usage
import { Button, Card, Toast } from '@/components/ui';

// Notification system
import { NotificationList } from '@/components/notifications/NotificationList';

// Layout components
import { Navigation } from '@/components/layout/Navigation';
import { ErrorBoundary } from '@/components/core/ErrorBoundary';
```

## Performance Considerations

### Bundle Optimization
- Dynamic imports for non-critical dependencies
- Code splitting at provider boundaries
- Lazy loading for heavy components

### Caching Strategy
- React Query for server state management
- 5-minute stale time for most queries
- Intelligent retry policies for failed requests

### Real-time Efficiency
- Channel-based message filtering
- Connection pooling and reuse
- Automatic cleanup on unmount

## Testing Strategy

### Unit Tests
- Provider context rendering
- Hook behavior validation
- Component prop handling
- Error boundary functionality

### Integration Tests
- Provider composition order
- Real-time message flow
- Notification system workflow
- Theme switching behavior

### E2E Tests
- Authentication flow
- Notification interactions
- Error recovery scenarios
- Accessibility compliance

## Migration & Compatibility

### From Previous Version
1. Update provider imports
2. Replace legacy theme context
3. Migrate to new notification system
4. Update observability hooks

### Browser Support
- Modern evergreen browsers
- Progressive enhancement for older browsers
- Graceful degradation for missing features

## Development Guidelines

### Code Organization
- Colocate related functionality
- Use consistent naming conventions
- Follow established patterns
- Document complex logic

### Error Handling
- Always use error boundaries
- Provide meaningful error messages
- Log errors for debugging
- Offer recovery options

### Accessibility
- Follow WCAG 2.1 AA guidelines
- Test with screen readers
- Ensure keyboard navigation
- Provide semantic markup

## Future Enhancements

### Planned Features
- Advanced notification filtering
- Performance metric dashboards
- Enhanced error recovery
- Offline capability

### Extension Points
- Custom notification types
- Additional observability metrics
- Theme customization
- Provider middleware

## Support & Troubleshooting

### Common Issues
1. **Provider order errors** - Check provider hierarchy
2. **Theme not persisting** - Verify localStorage access
3. **Real-time disconnections** - Check token validity
4. **Notification duplicates** - Review subscription cleanup

### Debug Tools
- React Query DevTools for state inspection
- Browser DevTools for performance monitoring
- Sentry dashboard for error tracking
- Custom logging for debugging

---

**Last Updated:** $(date)  
**Version:** 1.0.0  
**Dependencies:** React 18+, Next.js 14+, TypeScript 5+