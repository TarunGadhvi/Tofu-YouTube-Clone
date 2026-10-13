import { HydrateClient, trpc } from "@/trpc/server";
import { TrailView } from "@/modules/trails/ui/views/trail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ trailId: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { trailId } = await params;

  void trpc.trails.getOne.prefetch({ id: trailId });

  return (
    <HydrateClient>
      <TrailView trailId={trailId} />
    </HydrateClient>
  );
};

export default Page;
