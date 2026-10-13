import { HydrateClient, trpc } from "@/trpc/server";
import { StudioTrailView } from "@/modules/studio/ui/views/studio-trail-view";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ trailId: string }>;
}

const Page = async ({ params }: PageProps) => {
  const { trailId } = await params;

  void trpc.trails.getOne.prefetch({ id: trailId });
  void trpc.studio.getMany.prefetch({ limit: 50 });

  return (
    <HydrateClient>
      <StudioTrailView trailId={trailId} />
    </HydrateClient>
  );
};

export default Page;
