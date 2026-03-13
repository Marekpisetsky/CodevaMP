"use client";

type StudioOnboardingProps = {
  title: string;
  steps: string[];
  stepIndex: number;
  previousLabel: string;
  nextLabel: string;
  doneLabel: string;
  onPrevious: () => void;
  onNext: () => void;
  onDone: () => void;
};

export function StudioOnboarding({
  title,
  steps,
  stepIndex,
  previousLabel,
  nextLabel,
  doneLabel,
  onPrevious,
  onNext,
  onDone,
}: StudioOnboardingProps) {
  return (
    <div className="studio-onboarding">
      <strong>{title}</strong>
      <p>{steps[stepIndex]}</p>
      <div className="studio-onboarding-actions">
        <button type="button" onClick={onPrevious} disabled={stepIndex === 0}>
          {previousLabel}
        </button>
        {stepIndex < steps.length - 1 ? (
          <button type="button" onClick={onNext}>
            {nextLabel}
          </button>
        ) : (
          <button type="button" onClick={onDone}>
            {doneLabel}
          </button>
        )}
      </div>
    </div>
  );
}
