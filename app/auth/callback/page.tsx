"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");

    (async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      router.replace("/biblioteca");
    })();
  }, [router]);

  return (
    <div className="fade-in flex items-center justify-center px-5 py-15">
      <div className="font-pixel text-[11px] tracking-[0.16em] text-ink-faint">
        CONECTANDO...
      </div>
    </div>
  );
}
