import type { Metadata } from "next";
import { Team } from "@/components/screens/Team";
import { systemClock } from "@/lib/clock";
import { requireCan } from "@/server/auth/viewer";
import { withViewer } from "@/server/repo/context";
import { getTeam } from "@/server/repo/team";

export const metadata: Metadata = { title: "Team" };

export default async function Page(): Promise<React.JSX.Element> {
  const viewer = await requireCan("team.read");
  const team = await withViewer(viewer, (tx) => getTeam(tx, viewer, {}));
  return <Team team={team} today={systemClock.today()} />;
}
