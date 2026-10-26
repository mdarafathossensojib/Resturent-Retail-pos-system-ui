
import { AppShell } from "@/components/layout/app-shell";
import AuthGuard from "@/components/auth/AuthGuard";

export default function ManagementLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
