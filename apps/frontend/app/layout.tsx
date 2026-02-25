import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Nav from "./components/Nav";
import GoogleOAuthProvider from "./components/GoogleOAuthProvider";

export const metadata: Metadata = {
  title: "Library – Aspire",
  description: "Mini Library Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <GoogleOAuthProvider>
          <AuthProvider>
            <Nav />
            <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
