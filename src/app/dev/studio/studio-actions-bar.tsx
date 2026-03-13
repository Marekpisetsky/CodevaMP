"use client";

import Link from "next/link";
import type { ChangeEvent, MutableRefObject } from "react";

type StudioActionsBarProps = {
  publishLabel: string;
  advancedLabel: string;
  hideAdvancedLabel: string;
  showAdvancedTools: boolean;
  onToggleAdvanced: () => void;
  studioMode: "basic" | "pro";
  showGuideLabel: string;
  hideGuideLabel: string;
  viewGuideLabel: string;
  showOnboarding: boolean;
  onboardingDone: boolean;
  onToggleGuide: () => void;
  autosaveLabel: string;
  autosavePulse: boolean;
  uploadInputRef: MutableRefObject<HTMLInputElement | null>;
  folderUploadInputRef: MutableRefObject<HTMLInputElement | null>;
  onUploadFiles: (event: ChangeEvent<HTMLInputElement>) => void | Promise<void>;
};

export function StudioActionsBar({
  publishLabel,
  advancedLabel,
  hideAdvancedLabel,
  showAdvancedTools,
  onToggleAdvanced,
  studioMode,
  showGuideLabel,
  hideGuideLabel,
  viewGuideLabel,
  showOnboarding,
  onboardingDone,
  onToggleGuide,
  autosaveLabel,
  autosavePulse,
  uploadInputRef,
  folderUploadInputRef,
  onUploadFiles,
}: StudioActionsBarProps) {
  return (
    <div className="studio-actions">
      <div className="studio-actions__primary">
        <Link href="/dev" prefetch className="studio-action-link">
          {publishLabel}
        </Link>
        <button type="button" onClick={onToggleAdvanced}>
          {showAdvancedTools ? hideAdvancedLabel : advancedLabel}
        </button>
      </div>
      <div className="studio-actions__secondary">
        {studioMode === "basic" ? (
          <button type="button" onClick={onToggleGuide}>
            {showOnboarding ? hideGuideLabel : onboardingDone ? viewGuideLabel : showGuideLabel}
          </button>
        ) : null}
        <span className={`studio-autosave${autosavePulse ? " is-pulse" : ""}`}>{autosaveLabel}</span>
      </div>
      <input ref={uploadInputRef} type="file" multiple style={{ display: "none" }} onChange={onUploadFiles} />
      <input
        ref={(element) => {
          folderUploadInputRef.current = element;
          if (element) {
            element.setAttribute("webkitdirectory", "");
            element.setAttribute("directory", "");
          }
        }}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={onUploadFiles}
      />
    </div>
  );
}
