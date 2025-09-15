// MentorNavbar: navigation for mentor dashboard
import Link from "next/link";

export function MentorNavbar() {
  return (
    <nav className="bg-gray-900 text-white px-4 py-2 flex gap-4 mb-4">
      <Link href="/mentor" className="hover:underline">Dashboard</Link>
      <Link href="/mentor/queue" className="hover:underline">Review Queue</Link>
      <Link href="/mentor/review" className="hover:underline">Submission Review</Link>
      <Link href="/mentor/calibration" className="hover:underline">Calibration</Link>
      <Link href="/mentor/profile" className="hover:underline">Profile</Link>
    </nav>
  );
}
