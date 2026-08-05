"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export interface SessionUser {
  id: string;
  name: string;
}

interface SessionContextValue {
  user: SessionUser | null;
  signOut: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

function displayName(user: User): string {
  const metadata = user.user_metadata ?? {};
  const isSocial = user.app_metadata?.provider !== "email";
  if (isSocial) {
    return (
      metadata.full_name ||
      metadata.name ||
      metadata.user_name ||
      user.email ||
      "JUGADOR"
    );
  }
  return metadata.name || user.email || "JUGADOR";
}

function toSessionUser(user: User | null | undefined): SessionUser | null {
  if (!user) return null;
  return { id: user.id, name: displayName(user) };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(toSessionUser(data.session?.user));
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(toSessionUser(session?.user));
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const value: SessionContextValue = {
    user,
    signOut: () => {
      getSupabaseBrowserClient().auth.signOut();
    },
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
