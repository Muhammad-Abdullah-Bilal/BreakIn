// Workspace app route layout
import { WorkspaceLayout } from "../../src/modules/workspace/layouts/WorkspaceLayout";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WorkspaceLayout>{children}</WorkspaceLayout>;
}
