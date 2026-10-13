"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TrashIcon, PlusIcon, GripVerticalIcon } from "lucide-react";
import { toast } from "sonner";

import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface StudioTrailViewProps {
  trailId: string;
}

export const StudioTrailView = ({ trailId }: StudioTrailViewProps) => {
  const router = useRouter();
  const utils = trpc.useUtils();

  const [trail] = trpc.trails.getOne.useSuspenseQuery({ id: trailId });
  const [studioVideos] = trpc.studio.getMany.useSuspenseQuery({ limit: 50 });

  const [title, setTitle] = useState(trail.title);
  const [description, setDescription] = useState(trail.description || "");
  const [isPublished, setIsPublished] = useState(trail.isPublished);

  const [selectedVideoId, setSelectedVideoId] = useState(studioVideos.items[0]?.id || "");
  const [stepTitle, setStepTitle] = useState("");
  const [checkpointQuestion, setCheckpointQuestion] = useState("");
  const [option1, setOption1] = useState("");
  const [option2, setOption2] = useState("");
  const [correctIndex, setCorrectIndex] = useState(0);

  const updateMutation = trpc.trails.update.useMutation({
    onSuccess: () => {
      toast.success("Trail updated");
      utils.trails.getOne.invalidate({ id: trailId });
    },
    onError: () => {
      toast.error("Failed to update trail");
    },
  });

  const deleteMutation = trpc.trails.remove.useMutation({
    onSuccess: () => {
      toast.success("Trail deleted");
      router.push("/studio/trails");
    },
    onError: () => {
      toast.error("Failed to delete trail");
    },
  });

  const createStepMutation = trpc.trails.createStep.useMutation({
    onSuccess: () => {
      toast.success("Step added");
      utils.trails.getOne.invalidate({ id: trailId });
      setStepTitle("");
      setCheckpointQuestion("");
      setOption1("");
      setOption2("");
    },
    onError: () => {
      toast.error("Failed to add step");
    },
  });

  const removeStepMutation = trpc.trails.removeStep.useMutation({
    onSuccess: () => {
      toast.success("Step removed");
      utils.trails.getOne.invalidate({ id: trailId });
    },
    onError: () => {
      toast.error("Failed to remove step");
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      id: trailId,
      title,
      description,
      isPublished,
    });
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVideoId) return;

    const options = option1 && option2 ? [option1, option2] : undefined;
    createStepMutation.mutate({
      trailId,
      videoId: selectedVideoId,
      title: stepTitle || undefined,
      checkpointQuestion: checkpointQuestion || undefined,
      checkpointOptions: options,
      correctOptionIndex: options ? correctIndex : undefined,
    });
  };

  return (
    <div className="max-w-[1200px] mx-auto mb-10 px-4 pt-6 flex flex-col gap-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Trail</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate({ id: trailId })}
            disabled={deleteMutation.isPending}
          >
            Delete Trail
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="size-4"
          />
          <label htmlFor="published" className="text-sm font-medium cursor-pointer">
            Published (visible in discovery feed)
          </label>
        </div>
      </div>

      {/* Steps Manager */}
      <div className="bg-card border rounded-xl p-6 flex flex-col gap-6">
        <h2 className="text-xl font-semibold">Trail Steps ({trail.steps.length})</h2>

        <div className="divide-y flex flex-col gap-4">
          {trail.steps.map((step, idx) => (
            <div key={step.id} className="flex items-center justify-between pt-4 first:pt-0">
              <div className="flex items-center gap-3">
                <GripVerticalIcon className="size-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Step {idx + 1}</span>
                  <span className="font-medium text-sm">{step.title || step.video.title}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeStepMutation.mutate({ id: step.id })}
                disabled={removeStepMutation.isPending}
              >
                <TrashIcon className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Step Form */}
        <form onSubmit={handleAddStep} className="mt-4 p-4 bg-muted rounded-xl flex flex-col gap-4">
          <h3 className="font-semibold text-sm">Add Video Step</h3>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">Select Video from Studio</label>
            <select
              value={selectedVideoId}
              onChange={(e) => setSelectedVideoId(e.target.value)}
              className="p-2 rounded-md bg-background border text-sm"
            >
              {studioVideos.items.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">Custom Step Title (Optional)</label>
            <Input
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              placeholder="e.g. Introduction & Setup"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium">Checkpoint Quiz Question (Optional)</label>
            <Input
              value={checkpointQuestion}
              onChange={(e) => setCheckpointQuestion(e.target.value)}
              placeholder="e.g. What is the primary hook used?"
            />
          </div>
          {checkpointQuestion && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium">Quiz Options</label>
              <Input
                value={option1}
                onChange={(e) => setOption1(e.target.value)}
                placeholder="Option A"
              />
              <Input
                value={option2}
                onChange={(e) => setOption2(e.target.value)}
                placeholder="Option B"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs">Correct Option:</label>
                <select
                  value={correctIndex}
                  onChange={(e) => setCorrectIndex(Number(e.target.value))}
                  className="p-1 rounded bg-background border text-xs"
                >
                  <option value={0}>Option A</option>
                  <option value={1}>Option B</option>
                </select>
              </div>
            </div>
          )}
          <Button type="submit" disabled={createStepMutation.isPending}>
            <PlusIcon className="size-4 mr-2" />
            Add Step
          </Button>
        </form>
      </div>
    </div>
  );
};
