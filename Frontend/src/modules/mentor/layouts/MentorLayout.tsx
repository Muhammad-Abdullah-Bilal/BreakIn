// MentorLayout: wraps mentor dashboard pages with navbar
export function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <main className="p-4">{children}</main>
    </div>
  );
}
