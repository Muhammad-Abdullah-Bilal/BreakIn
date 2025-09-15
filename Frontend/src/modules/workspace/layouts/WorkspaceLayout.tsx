// WorkspaceLayout: wraps workspace pages with navbar
import { WorkspaceNavbar } from "../components/WorkspaceNavbar";

export function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <WorkspaceNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
