import { DEFAULT_LIMIT } from "@/constants";
import { HydrateClient, trpc } from "@/trpc/server";
import { TrailsView } from "@/modules/trails/ui/views/trails-view";

export const dynamic = "force-dynamic";

const Page = async () => {
  void trpc.trails.getMany.prefetchInfinite({ limit: DEFAULT_LIMIT });

  return (
    <HydrateClient>
      <TrailsView />
    </HydrateClient>
  );
};

export default Page;
