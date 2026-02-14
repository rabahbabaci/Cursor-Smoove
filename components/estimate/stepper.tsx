import { cn } from "@/lib/utils";

export const wizardSteps = [
  { id: "addresses", label: "Addresses & stops" },
  { id: "vehicle", label: "Vehicle" },
  { id: "items", label: "Items & photos" },
  { id: "schedule", label: "Schedule" },
  { id: "pricing", label: "Pricing review" },
  { id: "checkout", label: "Checkout" },
] as const;

export type WizardStepId = (typeof wizardSteps)[number]["id"];

export function WizardStepper({
  activeStep,
  onStepSelect,
}: {
  activeStep: WizardStepId;
  onStepSelect: (step: WizardStepId) => void;
}) {
  return (
    <ol className="grid grid-cols-2 gap-2 lg:grid-cols-6">
      {wizardSteps.map((step, index) => {
        const activeIndex = wizardSteps.findIndex((item) => item.id === activeStep);
        const isDone = index <= activeIndex;
        return (
          <li key={step.id}>
            <button
              type="button"
              onClick={() => onStepSelect(step.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-left text-xs transition sm:text-sm",
                isDone ? "border-primary/30 bg-primary/5 text-primary" : "border-border bg-white text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isDone ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span className="truncate">{step.label}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
