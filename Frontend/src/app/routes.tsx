// App routes definition
export const routes = [
  { path: '/', element: <HomePage />, layout: MainLayout },
  { path: '/auth/login', element: <LoginPage />, layout: AuthLayout },
  { path: '/dashboard', element: <DashboardPage />, layout: DashboardLayout, protected: true },
  { path: '*', element: <NotFoundPage />, layout: MinimalLayout },
];
