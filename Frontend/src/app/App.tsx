// Root App component
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryProvider>
          <ThemeProvider>
            <NotificationProvider>
              {/* <RouterProvider routes={routes} /> */}
              <div>App Loaded</div>
            </NotificationProvider>
          </ThemeProvider>
        </QueryProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
export default App;
