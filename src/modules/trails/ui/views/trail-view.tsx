"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth, useClerk } from "@clerk/nextjs";
import { CheckCircle2Icon, CircleIcon, PlayIcon, BookOpenIcon, AwardIcon } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Progress } from "@/components/ui/progress";
import MuxPlayer from "@mux/mux-player-react";

interface TrailViewProps {
  trailId: string;
}

export const TrailView = ({ trailId }: TrailViewProps) => {
  const clerk = useClerk();
  const { isSignedIn } = useAuth();
  const utils = trpc.useUtils();

  const [trail] = trpc.trails.getOne.useSuspenseQuery({ id: trailId });
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    trail.steps[0]?.id || null
  );
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);

  const enrollMutation = trpc.trails.enroll.useMutation({
    onSuccess: () => {
      toast.success("Enrolled in trail!");
      utils.trails.getOne.invalidate({ id: trailId });
    },
    onError: () => {
      toast.error("Something went wrong");
    },
  });

  const updateProgressMutation = trpc.trails.updateProgress.useMutation({
    onSuccess: () => {
      toast.success("Progress updated!");
      utils.trails.getOne.invalidate({ id: trailId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update progress");
    },
  });

  const selectedStep = trail.steps.find((s) => s.id === selectedStepId) || trail.steps[0];
  const selectedStepProgress = trail.progress.find((p) => p.stepId === selectedStep?.id);

  const completedStepsCount = trail.progress.filter((p) => p.completed).length;
  const progressPercentage = trail.steps.length > 0 ? (completedStepsCount / trail.steps.length) * 100 : 0;

  const handleEnroll = () => {
    if (!isSignedIn) {
      return clerk.openSignIn();
    }
    enrollMutation.mutate({ trailId });
  };

  const handleToggleComplete = (stepId: string, completed: boolean) => {
    if (!isSignedIn) {
      return clerk.openSignIn();
    }
    updateProgressMutation.mutate({
      trailId,
      stepId,
      completed,
      selectedOptionIndex: selectedQuizOption !== null ? selectedQuizOption : undefined,
    });
  };

  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-6 flex flex-col gap-y-6">
      {/* Trail Header */}
      <div className="bg-card border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start justify-between">
        <div className="flex flex-col gap-4 max-w-2xl">
          <div className="flex items-center gap-3">
            <UserAvatar name={trail.user.name} imageUrl={trail.user.imageUrl} size="lg" />
            <div className="flex flex-col">
              <h2 className="font-semibold text-lg">{trail.title}</h2>
              <p className="text-sm text-muted-foreground">Created by {trail.user.name}</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{trail.description || "No description provided."}</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <BookOpenIcon className="size-4 text-muted-foreground" />
              <span>{trail.steps.length} Steps</span>
            </div>
            {trail.enrollment ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <AwardIcon className="size-4" />
                <span>Enrolled ({completedStepsCount}/{trail.steps.length} completed)</span>
              </div>
            ) : (
              <Button onClick={handleEnroll} disabled={enrollMutation.isPending}>
                Start Trail
              </Button>
            )}
          </div>
          {trail.enrollment && (
            <div className="w-full flex flex-col gap-1 mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}
        </div>
        {trail.thumbnailUrl && (
          <div className="relative aspect-video w-full md:w-96 rounded-xl overflow-hidden bg-muted">
            <Image src={trail.thumbnailUrl} alt={trail.title} fill className="object-cover" />
          </div>
        )}
      </div>

      {/* Main Learning Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Video Player & Checkpoint Quiz */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {selectedStep ? (
            <div className="flex flex-col gap-4">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
                {selectedStep.video.muxPlaybackId ? (
                  <MuxPlayer
                    playbackId={selectedStep.video.muxPlaybackId}
                    accentColor="#ff0000"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    Video processing or unavailable
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4 bg-card border rounded-xl">
                <h3 className="text-lg font-semibold">
                  Step {selectedStep.position + 1}: {selectedStep.title || selectedStep.video.title}
                </h3>
                <p className="text-sm text-muted-foreground">{selectedStep.video.description}</p>

                {/* Checkpoint / Quiz Section */}
                {selectedStep.checkpointQuestion && selectedStep.checkpointOptions && (
                  <div className="mt-4 p-4 bg-muted rounded-xl flex flex-col gap-3">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <AwardIcon className="size-4 text-primary" />
                      Checkpoint Quiz: {selectedStep.checkpointQuestion}
                    </h4>
                    <div className="flex flex-col gap-2">
                      {selectedStep.checkpointOptions.map((option, idx) => (
                        <label
                          key={idx}
                          className="flex items-center gap-2 text-sm p-2 rounded-lg bg-card border cursor-pointer hover:bg-accent/50"
                        >
                          <input
                            type="radio"
                            name={`quiz-${selectedStep.id}`}
                            checked={selectedQuizOption === idx}
                            onChange={() => setSelectedQuizOption(idx)}
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  {trail.enrollment ? (
                    <Button
                      variant={selectedStepProgress?.completed ? "outline" : "default"}
                      onClick={() =>
                        handleToggleComplete(selectedStep.id, !selectedStepProgress?.completed)
                      }
                      disabled={updateProgressMutation.isPending}
                    >
                      {selectedStepProgress?.completed ? "Completed (Click to unmark)" : "Mark Step Complete"}
                    </Button>
                  ) : (
                    <Button onClick={handleEnroll}>Enroll to track progress</Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 bg-card border rounded-xl">
              <p className="text-muted-foreground">Select a step to begin learning.</p>
            </div>
          )}
        </div>

        {/* Right: Steps Sidebar */}
        <div className="flex flex-col gap-4 bg-card border rounded-xl p-4 h-fit">
          <h3 className="font-semibold text-base">Trail Steps</h3>
          <div className="flex flex-col gap-2">
            {trail.steps.map((step, index) => {
              const isSelected = step.id === selectedStepId;
              const stepProgress = trail.progress.find((p) => p.stepId === step.id);
              const isCompleted = stepProgress?.completed;

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setSelectedStepId(step.id);
                    setSelectedQuizOption(null);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected ? "bg-primary/10 border border-primary/20" : "hover:bg-muted"
                  }`}
                >
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <CheckCircle2Icon className="size-5 text-emerald-600" />
                    ) : (
                      <CircleIcon className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden flex-1">
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                    <span className="text-sm font-medium line-clamp-1">
                      {step.title || step.video.title}
                    </span>
                  </div>
                  <PlayIcon className="size-4 text-muted-foreground flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
