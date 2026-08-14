import AccessDenied from '@/components/auth/AccessDenied';

export const metadata = {
  title: 'Access Restricted | BreakIn Direct',
  description: 'Access restricted area - 403 Forbidden',
};

export default function AccessDeniedPage() {
  return <AccessDenied />;
}
