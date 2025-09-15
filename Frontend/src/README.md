# BreakIn Platform Frontend Architecture

## Overview

The BreakIn platform uses a modular frontend architecture built with Next.js and TypeScript. This architecture promotes clean separation of concerns, reusability, and maintainability by organizing code into feature-based modules.

## Module Structure

Each module follows a consistent structure:

```
modules/
  └── [module-name]/
      ├── components/     # React components specific to this module
      │   └── index.ts    # Barrel file exporting all components
      ├── hooks/          # Custom React hooks for this module
      │   └── index.ts    # Barrel file exporting all hooks
      ├── types/          # TypeScript interfaces and types
      │   └── index.ts    # Barrel file exporting all types
      ├── services/       # API services and data fetching logic
      │   └── index.ts    # Barrel file exporting all services
      ├── context/        # React context providers (if needed)
      │   └── index.ts    # Barrel file exporting all contexts
      ├── utils/          # Utility functions specific to this module
      │   └── index.ts    # Barrel file exporting all utilities
      ├── pages/          # Module-specific pages
      │   └── index.ts    # Barrel file exporting all pages
      └── index.ts        # Main barrel file exporting public API of the module
```

## Creating New Modules

Follow these steps to create a new module:

1. **Create the module directory structure**:
   ```
   mkdir -p src/modules/[module-name]/{components,hooks,types,services,context,utils,pages}
   ```

2. **Define types**:
   Create necessary TypeScript interfaces and types in the `types/` directory.
   
   Example (`types/user.ts`):
   ```typescript
   export interface User {
     id: string;
     name: string;
     email: string;
     role: string;
   }
   ```

3. **Create services**:
   Add API services in the `services/` directory.
   
   Example (`services/userService.ts`):
   ```typescript
   import { User } from '../types/user';

   const API_BASE_URL = '/api/users';

   export class UserService {
     static async getUsers(): Promise<User[]> {
       const response = await fetch(API_BASE_URL);
       if (!response.ok) throw new Error('Failed to fetch users');
       return response.json();
     }
   }
   ```

4. **Implement components**:
   Create React components in the `components/` directory.
   
   Example (`components/UserCard.tsx`):
   ```tsx
   import React from 'react';
   import { User } from '../types/user';

   interface UserCardProps {
     user: User;
     onSelect?: (user: User) => void;
   }

   export function UserCard({ user, onSelect }: UserCardProps) {
     return (
       <div 
         className="p-4 border rounded-md cursor-pointer"
         onClick={() => onSelect?.(user)}
       >
         <h3 className="font-medium">{user.name}</h3>
         <p className="text-sm text-gray-500">{user.email}</p>
       </div>
     );
   }
   ```

5. **Create hooks**:
   Add custom hooks in the `hooks/` directory.
   
   Example (`hooks/useUsers.ts`):
   ```typescript
   import { useState, useEffect } from 'react';
   import { User } from '../types/user';
   import { UserService } from '../services/userService';

   export function useUsers() {
     const [users, setUsers] = useState<User[]>([]);
     const [loading, setLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);

     useEffect(() => {
       const fetchUsers = async () => {
         try {
           const data = await UserService.getUsers();
           setUsers(data);
         } catch (err) {
           setError(err instanceof Error ? err : new Error('Unknown error'));
         } finally {
           setLoading(false);
         }
       };

       fetchUsers();
     }, []);

     return { users, loading, error };
   }
   ```

6. **Add pages** (if needed):
   Create module-specific pages in the `pages/` directory.

7. **Create barrel files**:
   Add index.ts files in each directory to export their contents.
   
   Example (`components/index.ts`):
   ```typescript
   export * from './UserCard';
   export * from './UserList';
   ```

8. **Create the main module index.ts**:
   Export the public API of your module.
   
   Example (`index.ts`):
   ```typescript
   // Export public API
   export * from './components';
   export * from './hooks';
   export * from './types';
   export * from './services';
   export * from './context';
   ```

9. **Update the src/index.ts**:
   Add your new module to the main barrel file.
   
   ```typescript
   export * as YourNewModule from './modules/your-new-module';
   ```

## Using Modules

Import module functionality where needed:

```typescript
// Direct import from module
import { UserCard } from '@/src/modules/users/components';

// Using main index.ts
import { UsersModule } from '@/src';

function App() {
  return (
    <div>
      <UsersModule.UserCard user={{ id: '1', name: 'John', email: 'john@example.com', role: 'user' }} />
    </div>
  );
}
```

## Best Practices

1. **Keep modules focused**: Each module should represent a distinct feature or domain concept.
2. **Minimize cross-module dependencies**: Modules should be as self-contained as possible.
3. **Shared functionality**: Place shared/common code in a dedicated `core` module.
4. **Consistent naming**: Follow consistent naming conventions across all modules.
5. **Export selectively**: Only export what's needed from each module (avoid exporting private implementation details).
6. **Type everything**: Use TypeScript types/interfaces for all components, hooks, and services.

## Example Module

Let's walk through creating a complete "notifications" module:

1. **Directory structure**:
```
modules/
  └── notifications/
      ├── components/
      ├── hooks/
      ├── types/
      ├── services/
      ├── context/
      └── index.ts
```

2. **Define types** (`types/notification.ts`):
```typescript
export type NotificationType = 'message' | 'alert' | 'update' | 'reminder';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
```

3. **Create types index** (`types/index.ts`):
```typescript
export * from './notification';
```

4. **Create service** (`services/notificationService.ts`):
```typescript
import { Notification } from '../types/notification';

const API_BASE_URL = '/api/notifications';

export class NotificationService {
  static async getNotifications(): Promise<Notification[]> {
    const response = await fetch(API_BASE_URL);
    if (!response.ok) throw new Error('Failed to fetch notifications');
    return response.json();
  }
  
  static async markAsRead(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/${id}/read`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error('Failed to mark notification as read');
  }
}
```

5. **Create services index** (`services/index.ts`):
```typescript
export * from './notificationService';
```

6. **Create context** (`context/notificationContext.tsx`):
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '../types/notification';
import { NotificationService } from '../services/notificationService';

interface NotificationContextValue {
  notifications: Notification[];
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await NotificationService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
  }, []);
  
  const markAsRead = async (id: string) => {
    try {
      await NotificationService.markAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return (
    <NotificationContext.Provider value={{ notifications, loading, markAsRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}
```

7. **Create context index** (`context/index.ts`):
```typescript
export * from './notificationContext';
```

8. **Create components** (`components/notificationItem.tsx`):
```typescript
import React from 'react';
import { Notification } from '../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
}

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  return (
    <div 
      className={`p-4 border-b ${notification.read ? 'bg-gray-50' : 'bg-white'}`}
      onClick={() => !notification.read && onRead(notification.id)}
    >
      <div className="flex justify-between">
        <h3 className="font-medium">{notification.title}</h3>
        {!notification.read && (
          <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
        )}
      </div>
      <p className="text-sm text-gray-600">{notification.message}</p>
      <span className="text-xs text-gray-400">{new Date(notification.createdAt).toLocaleString()}</span>
    </div>
  );
}
```

9. **Create components index** (`components/index.ts`):
```typescript
export * from './notificationItem';
```

10. **Create main module index** (`index.ts`):
```typescript
// Notification module exports
export * from './components';
export * from './hooks';
export * from './types';
export * from './services';
export * from './context';
```

By following this architecture, you can build a maintainable and scalable frontend application where each feature is encapsulated in its own module with clear boundaries and responsibilities.
