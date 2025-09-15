// MainLayout: App shell with nav + content
import { Navbar } from "../components/common/Navbar";

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Navbar />
      <main className="p-4">{children}</main>
    </div>
  );
}
