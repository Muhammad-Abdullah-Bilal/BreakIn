// Auth app route layout
import { AuthLayout } from "../../src/modules/auth/layouts/AuthLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
