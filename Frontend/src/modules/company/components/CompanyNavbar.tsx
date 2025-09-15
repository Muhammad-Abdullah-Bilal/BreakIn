// CompanyNavbar: navigation for company dashboard
import Link from "next/link";

export function CompanyNavbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-2 flex gap-4 mb-4">
      <Link href="/company" className="hover:underline">Dashboard</Link>
      <Link href="/company/talent" className="hover:underline">Talent Search</Link>
      <Link href="/company/job-postings" className="hover:underline">Job Postings</Link>
      <Link href="/company/pipeline" className="hover:underline">Pipeline</Link>
      <Link href="/company/settings" className="hover:underline">Settings</Link>
    </nav>
  );
}
