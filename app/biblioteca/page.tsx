import { getGames } from "@/app/data/db";
import { BibliotecaClient } from "@/app/biblioteca/biblioteca-client";

export default async function BibliotecaPage() {
  const games = await getGames();
  return <BibliotecaClient games={games} />;
}
