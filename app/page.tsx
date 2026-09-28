import { getWeddingData } from "@/lib/db";
import { PublicInvitationView } from "@/components/invitation/PublicInvitationView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const weddingData = await getWeddingData();

  return <PublicInvitationView initialData={weddingData} />;
}
