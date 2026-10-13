import { HydrateClient, trpc } from "@/trpc/server";
import { StudioTrailsView } from "@/modules/studio/ui/views/studio-trails-view";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.trails.getStudioMany.prefetch({ limit: 10 });

  return (
    <HydrateClient>
      <StudioTrailsView />
    </HydrateClient>
  );
};

export default Page;
