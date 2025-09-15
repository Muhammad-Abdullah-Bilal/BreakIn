// Company app route layout
import { CompanyLayout } from "../../src/modules/company/layouts/CompanyLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <CompanyLayout>{children}</CompanyLayout>;
}
