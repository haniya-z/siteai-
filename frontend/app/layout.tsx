import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SiteAI — Engineering Decision Intelligence that helps to make better decision and makes management easy and efficient",
  description: "AI Operating System for EPC Project Delivery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0e0e0d" }}>
        {children}
      </body>
    </html>
  );
}
