import { createSupabaseClient } from "@/lib/supabase/client";
import type { Game, ScoreRow } from "@/app/data/games";

export async function getGames(): Promise<Game[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from("games").select("*");
  if (error) throw error;
  return data as Game[];
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Game | null;
}

export async function getTopScores(
  gameId: string,
  limit: number,
): Promise<ScoreRow[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("scores")
    .select("player_name, score, created_at")
    .eq("game_id", gameId)
    .order("score", { ascending: false })
    .limit(limit);
  if (error) throw error;

  return (data ?? []).map((row, i) => {
    const createdAt = new Date(row.created_at);
    const date = `${String(createdAt.getDate()).padStart(2, "0")}/${String(
      createdAt.getMonth() + 1,
    ).padStart(2, "0")}/${createdAt.getFullYear()}`;
    return {
      rank: i + 1,
      name: row.player_name,
      score: row.score,
      date,
    };
  });
}

export async function saveScore(
  gameId: string,
  playerName: string,
  score: number,
): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player_name: playerName, score });
  if (error) throw error;
}
