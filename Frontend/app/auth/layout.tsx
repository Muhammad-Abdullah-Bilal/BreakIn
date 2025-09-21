// Auth app route layout
import { AuthLayout } from "../../src/app/layouts/AuthLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
