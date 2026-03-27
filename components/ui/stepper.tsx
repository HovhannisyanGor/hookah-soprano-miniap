import { cn } from "@/lib/format";

export function Stepper({
  steps,
  current
}: {
  steps: string[];
  current: number;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {steps.map((step, index) => (
          <div key={step} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                index <= current
                  ? "border-brass/50 bg-brass/20 text-cream"
                  : "border-white/10 bg-white/5 text-zinc-400"
              )}
            >
              {index + 1}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-px flex-1",
                  index < current ? "bg-brass/60" : "bg-white/10"
                )}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-zinc-300">{steps[current]}</p>
    </div>
  );
}
