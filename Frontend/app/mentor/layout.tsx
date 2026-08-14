// Mentor app route layout
import { MentorLayout } from "../../src/modules/mentor/layouts/MentorLayout";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={['mentor', 'admin']}>
      <MentorLayout>{children}</MentorLayout>
    </RoleGuard>
  );
}
