
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./globals.css";

export const metadata = {
  title: "Retail POS System",
  description: "Retail Point of Sale and Inventory Management System",
};

export const viewport = {
  themeColor: "#f7f8fa",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
