"use client";

import { GoogleOAuthProvider as GoogleProvider } from "@react-oauth/google";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

export default function GoogleOAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!clientId) return <>{children}</>;
  return <GoogleProvider clientId={clientId}>{children}</GoogleProvider>;
}
