// Mentor app route layout
import { MentorLayout } from "../../src/modules/mentor/layouts/MentorLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MentorLayout>{children}</MentorLayout>;
}
