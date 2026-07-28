import { getGames, getTopScores } from "@/app/data/db";
import { SalonClient } from "@/app/salon/salon-client";

export default async function SalonPage() {
  const [games, asteroidsScores, tetrisScores] = await Promise.all([
    getGames(),
    getTopScores("asteroides", 10),
    getTopScores("tetris", 10),
  ]);
  return (
    <SalonClient
      games={games}
      asteroidsScores={asteroidsScores}
      tetrisScores={tetrisScores}
    />
  );
}
