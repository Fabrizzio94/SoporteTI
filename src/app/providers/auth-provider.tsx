"use client"; // Muy importante: esto lo convierte en Client Component

import { SessionProvider } from "next-auth/react";

export function AuthProviders({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
