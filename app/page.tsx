import { getWeddingData } from "@/lib/db";
import { PublicInvitationView } from "@/components/invitation/PublicInvitationView";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function HomePage() {
  const weddingData = await getWeddingData(true);

  return <PublicInvitationView initialData={weddingData} />;
}
