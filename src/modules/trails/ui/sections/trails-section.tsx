"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { BookOpenIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

import { trpc } from "@/trpc/client";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { TrailCard } from "../components/trail-card";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";

export const TrailsSection = () => {
  return (
    <Suspense fallback={<TrailsSectionSkeleton />}>
      <ErrorBoundary fallback={<div className="flex flex-col items-center justify-center h-96 gap-4 text-muted-foreground">Error loading trails. Please ensure database migrations are up to date.</div>}>
        <TrailsSectionSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

export const TrailsSectionSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-4 animate-pulse">
          <div className="aspect-video w-full rounded-xl bg-muted" />
          <div className="flex gap-3">
            <div className="size-10 rounded-full bg-muted flex-shrink-0" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const TrailsSectionSuspense = () => {
  const { isSignedIn } = useAuth();
  const [trails, query] = trpc.trails.getMany.useSuspenseInfiniteQuery(
    {
      limit: DEFAULT_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const allTrails = trails.pages.flatMap((page) => page.items);

  if (allTrails.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] gap-6 text-center px-4 bg-card border rounded-2xl shadow-sm">
        <div className="flex items-center justify-center size-20 rounded-full bg-primary/10 text-primary">
          <BookOpenIcon className="size-10" />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-bold tracking-tight">Your next skill starts here</h2>
          <p className="text-sm text-muted-foreground">
            Explore guided video sequences, complete interactive checkpoints, and master new skills step by step.
          </p>
        </div>
        {isSignedIn ? (
          <Button asChild className="rounded-full">
            <Link prefetch href="/studio/trails">
              <PlusIcon className="size-4 mr-2" />
              Create a Trail in Studio
            </Link>
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground">
            Trails will appear here when creators publish them, or sign in to create your own learning sequence in Studio.
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 gap-y-6">
        {allTrails.map((trail) => (
          <TrailCard
            key={trail.id}
            id={trail.id}
            title={trail.title}
            description={trail.description}
            thumbnailUrl={trail.thumbnailUrl}
            stepCount={trail.stepCount}
            user={trail.user}
          />
        ))}
      </div>
      <InfiniteScroll
        hasNextPage={query.hasNextPage}
        isFetchingNextPage={query.isFetchingNextPage}
        fetchNextPage={query.fetchNextPage}
      />
    </div>
  );
};
