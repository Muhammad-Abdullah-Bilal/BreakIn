// MentorLayout: wraps mentor dashboard pages with navbar
import { MentorNavbar } from "../components/MentorNavbar";

export function MentorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <MentorNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
