import { createSupabaseClient } from "@/lib/supabase/client";

interface SupabaseHealthResponse {
  ok: boolean;
  error?: string;
}

function json(body: SupabaseHealthResponse, status: number) {
  return Response.json(body, { status });
}

export async function GET() {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return json({ ok: false, error: error.message }, 500);
    }

    return json({ ok: true }, 200);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido.";
    return json({ ok: false, error: message }, 500);
  }
}
