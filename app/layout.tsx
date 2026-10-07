import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KotakPinalti Event",
  description: "Fair team drawing for football events"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}