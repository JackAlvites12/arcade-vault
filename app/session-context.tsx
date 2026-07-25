"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface SessionUser {
  name: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  login: (user: SessionUser | null) => void;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  const value: SessionContextValue = {
    user,
    login: (u) => setUser(u),
    signOut: () => setUser(null),
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
