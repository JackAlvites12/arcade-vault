import { notFound } from "next/navigation";
import { getGame } from "@/app/data/db";
import { JugarClient } from "@/app/jugar/[id]/jugar-client";

export default async function ReproductorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) notFound();

  return <JugarClient game={game} />;
}
