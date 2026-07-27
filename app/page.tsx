import { getGames } from "@/app/data/db";
import { HomeClient } from "@/app/home-client";

export default async function Home() {
  const games = await getGames();
  return <HomeClient games={games} />;
}
