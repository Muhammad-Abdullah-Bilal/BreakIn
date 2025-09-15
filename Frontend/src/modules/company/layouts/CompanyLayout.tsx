// CompanyLayout: wraps company dashboard pages with navbar
import { CompanyNavbar } from "../components/CompanyNavbar";

export function CompanyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CompanyNavbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
