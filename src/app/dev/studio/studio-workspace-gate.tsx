"use client";

import Link from "next/link";
import type { StackKey } from "./studio-core";

type StackOption = {
  id: StackKey;
  label: string;
};

type StudioWorkspaceGateProps = {
  title: string;
  description: string;
  badge: string;
  stackOptions: StackOption[];
  stackDescriptions: Record<StackKey, string>;
};

export function StudioWorkspaceGate({
  title,
  description,
  badge,
  stackOptions,
  stackDescriptions,
}: StudioWorkspaceGateProps) {
  return (
    <section className="dev-lab" aria-label={title}>
      <div className="dev-lab__head dev-studio-head">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="dev-status dev-status--building">{badge}</span>
      </div>
      <div className="studio-gate-grid">
        {stackOptions.map((option) => (
          <Link key={option.id} href={`/dev/studio?stack=${option.id}`} className="studio-gate-card">
            <strong>{option.label}</strong>
            <span>{stackDescriptions[option.id]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
