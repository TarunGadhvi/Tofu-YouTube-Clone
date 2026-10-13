import { TrailsSection } from "../sections/trails-section";

export const TrailsView = () => {
  return (
    <div className="max-w-[2400px] mx-auto mb-10 px-4 pt-6 flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        <h1 className="text-2xl font-bold">TOFU Trails</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Follow guided learning sequences, complete checkpoints, and master new skills step by step.
        </p>
      </div>
      <TrailsSection />
    </div>
  );
};
