"use client";

import Link from "next/link";

type StudioTopbarProps = {
  title: string;
  stackLabel: string;
  studioMode: "basic" | "pro";
  setStudioMode: (mode: "basic" | "pro") => void;
  autosaveLabel: string;
  authHref: string;
  showAuthCta: boolean;
  signInLabel: string;
  githubDevLabel: string;
  onOpenGithubDev: () => void;
  languageLabel: string;
  onToggleLanguage: () => void;
  backLabel: string;
  modeLabel: string;
  basicLabel: string;
  proLabel: string;
};

export function StudioTopbar({
  title,
  stackLabel,
  studioMode,
  setStudioMode,
  autosaveLabel,
  authHref,
  showAuthCta,
  signInLabel,
  githubDevLabel,
  onOpenGithubDev,
  languageLabel,
  onToggleLanguage,
  backLabel,
  modeLabel,
  basicLabel,
  proLabel,
}: StudioTopbarProps) {
  return (
    <header className="dev-topbar">
      <Link href="/dev" className="dev-brand" prefetch>
        <span className="dev-brand__badge">DV</span>
        <span className="dev-brand__text">
          <strong>{title}</strong>
          <span>{stackLabel}</span>
        </span>
      </Link>
      <nav className="dev-nav">
        <Link href="/dev" prefetch>
          {backLabel}
        </Link>
      </nav>
      <div className="studio-mode-switch" role="group" aria-label={modeLabel}>
        <button type="button" className={studioMode === "basic" ? "is-active" : ""} onClick={() => setStudioMode("basic")}>
          {basicLabel}
        </button>
        <button type="button" className={studioMode === "pro" ? "is-active" : ""} onClick={() => setStudioMode("pro")}>
          {proLabel}
        </button>
      </div>
      <div className="studio-topbar-meta">
        <span className="studio-token-state">{autosaveLabel}</span>
        {showAuthCta ? (
          <Link href={authHref} className="dev-topbar__cta dev-topbar__cta--ghost" prefetch>
            {signInLabel}
          </Link>
        ) : null}
        <button type="button" className="dev-topbar__cta" onClick={onOpenGithubDev}>
          {githubDevLabel}
        </button>
        <button type="button" className="dev-topbar__cta" onClick={onToggleLanguage}>
          {languageLabel}
        </button>
      </div>
    </header>
  );
}
