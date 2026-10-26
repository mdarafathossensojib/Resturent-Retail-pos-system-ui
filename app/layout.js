
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Providers from "./providers";

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
        <Providers>{children}</Providers>

        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
