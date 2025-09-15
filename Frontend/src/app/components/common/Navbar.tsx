// Navbar
import Link from "next/link";

export function Navbar() {
	return (
		<nav className="bg-gray-900 text-white px-4 py-2 flex gap-4">
			<Link href="/workspace" className="hover:underline">Dashboard</Link>
			<Link href="/workspace/proof" className="hover:underline">Proof of Work</Link>
			<Link href="/workspace/sprint" className="hover:underline">Sprint</Link>
			<Link href="/workspace/submission" className="hover:underline">Submission</Link>
			<Link href="/workspace/feedback" className="hover:underline">Feedback</Link>
		</nav>
	);
}
