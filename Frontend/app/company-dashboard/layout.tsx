import { RoleGuard } from '@/components/auth/RoleGuard';

export default function CompanyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['employer', 'admin']}>
      {children}
    </RoleGuard>
  );
}
