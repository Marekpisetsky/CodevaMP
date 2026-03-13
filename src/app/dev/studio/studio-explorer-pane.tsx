"use client";

import type { DragEvent, ReactNode } from "react";

type StudioExplorerPaneProps = {
  title: string;
  newLabel: string;
  onCreateEntry: () => void;
  dragFilePath: string | null;
  dropLabel: string;
  onDropToRoot: (source: string) => void;
  tree: ReactNode;
};

export function StudioExplorerPane({
  title,
  newLabel,
  onCreateEntry,
  dragFilePath,
  dropLabel,
  onDropToRoot,
  tree,
}: StudioExplorerPaneProps) {
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const source = event.dataTransfer.getData("text/plain");
    if (source) onDropToRoot(source);
  };

  return (
    <aside className="dev-card studio-pane">
      <div className="dev-card__head">
        <h2 className="studio-heading">{title}</h2>
        <button type="button" className="dev-action-secondary" onClick={onCreateEntry}>
          {newLabel}
        </button>
      </div>
      <div className={`dev-drop-root${dragFilePath ? " is-active" : ""}`} onDragOver={(event) => event.preventDefault()} onDrop={onDrop}>
        {dropLabel}
      </div>
      <div className="dev-tree">{tree}</div>
    </aside>
  );
}
