
import AuthGuard from "@/components/auth/AuthGuard";

export default function POSLayout({ children }) {
  return <AuthGuard>{children}</AuthGuard>;
}
