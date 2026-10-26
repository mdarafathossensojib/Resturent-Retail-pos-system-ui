
"use client";

import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "@/components/auth/AuthProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
}
