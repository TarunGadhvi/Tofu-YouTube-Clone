"use client";

import { useRouter } from "next/navigation";
import { PlusIcon, BookOpenIcon } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const StudioTrailsView = () => {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [trails] = trpc.trails.getStudioMany.useSuspenseQuery({ limit: 10 });

  const createMutation = trpc.trails.create.useMutation({
    onSuccess: (data) => {
      toast.success("Trail created");
      utils.trails.getStudioMany.invalidate();
      router.push(`/studio/trails/${data.id}`);
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-6 flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          <h1 className="text-2xl font-bold">Creator Trails</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Manage your guided learning trails and student progression.
          </p>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <PlusIcon className="size-4 mr-2" />
          New Trail
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {trails.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <BookOpenIcon className="size-12 text-muted-foreground" />
            <p className="text-muted-foreground">You haven&apos;t created any trails yet.</p>
            <Button onClick={() => createMutation.mutate()}>Create your first trail</Button>
          </div>
        ) : (
          <div className="divide-y">
            {trails.items.map((trail) => (
              <div key={trail.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition">
                <div className="flex flex-col gap-1">
                  <Link href={`/studio/trails/${trail.id}`} className="font-semibold hover:underline">
                    {trail.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {trail.stepCount} steps • {trail.isPublished ? "Published" : "Draft"}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/studio/trails/${trail.id}`}>Edit Trail</Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
