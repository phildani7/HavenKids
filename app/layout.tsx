import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Haven Kids — A Safe Place to Be a Kid",
  description:
    "A safe, free, AI-moderated community platform for Christian kids ages 7–18. Discover communities, doodle together, pray together, and grow together.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>😇</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="sunshine">
      <body>{children}</body>
    </html>
  );
}
