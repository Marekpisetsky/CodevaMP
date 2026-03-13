"use client";

import type { KeyboardEvent } from "react";
import type { ConsoleEntry, StackKey } from "./studio-core";

type Tx = (es: string, en: string) => string;

type StudioPreviewConsolePaneProps = {
  tx: Tx;
  stack: StackKey;
  previewDoc: string;
  setPreviewFocus: (value: boolean | ((prev: boolean) => boolean)) => void;
  openPreviewInNewTab: () => void;
  templateNotes: string;
  studioMode: "basic" | "pro";
  dependencyInput: string;
  setDependencyInput: (value: string) => void;
  addDependency: () => void;
  dependencies: string[];
  removeDependency: (dep: string) => void;
  consoleEntries: ConsoleEntry[];
  clearConsole: () => void;
  children?: React.ReactNode;
};

export function StudioPreviewConsolePane({
  tx,
  stack,
  previewDoc,
  setPreviewFocus,
  openPreviewInNewTab,
  templateNotes,
  studioMode,
  dependencyInput,
  setDependencyInput,
  addDependency,
  dependencies,
  removeDependency,
  consoleEntries,
  clearConsole,
  children,
}: StudioPreviewConsolePaneProps) {
  return (
    <section className="dev-card studio-pane studio-right">
      <div className="dev-card__head">
        <h2 className="studio-heading">{tx("Preview + Consola", "Preview + Console")}</h2>
        {stack === "web" ? (
          <button type="button" className="dev-action-secondary" onClick={openPreviewInNewTab}>
            {tx("Abrir vista en vivo", "Open live view")}
          </button>
        ) : null}
      </div>
      {stack === "web" ? (
        <button type="button" className="studio-preview-wrap" onClick={() => setPreviewFocus((prev) => !prev)}>
          <iframe title={tx("Vista previa web", "Web preview")} srcDoc={previewDoc} sandbox="allow-scripts" referrerPolicy="no-referrer" className="studio-preview" />
        </button>
      ) : (
        <div className="dev-card__preview-empty studio-placeholder">
          <span>{tx("Runtime en workspace externo", "Runtime in external workspace")}</span>
          <p>{templateNotes}</p>
        </div>
      )}

      <details className="studio-panel" open={studioMode === "basic"}>
        <summary>{tx("Dependencias", "Dependencies")}</summary>
        <div className="studio-deps">
          <div className="studio-deps-row">
            <input
              id="deps-input"
              type="text"
              value={dependencyInput}
              placeholder="zod, axios, lodash"
              onChange={(event) => setDependencyInput(event.target.value)}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addDependency();
                }
              }}
            />
            <button type="button" onClick={addDependency}>
              {tx("Agregar", "Add")}
            </button>
          </div>
          <div className="dev-card__meta">
            {dependencies.length ? (
              dependencies.map((dep) => (
                <span key={dep}>
                  {dep}
                  <button type="button" onClick={() => removeDependency(dep)}>
                    x
                  </button>
                </span>
              ))
            ) : (
              <span>{tx("Sin dependencias", "No dependencies")}</span>
            )}
          </div>
        </div>
      </details>

      {children}

      <details className="studio-panel" open>
        <summary>{tx("Consola", "Console")}</summary>
        <div className="studio-console">
          <div className="studio-console-head">
            <strong>{tx("Logs de runtime", "Runtime logs")}</strong>
            <button type="button" onClick={clearConsole}>
              {tx("Limpiar", "Clear")}
            </button>
          </div>
          <div className="studio-console-body">
            {consoleEntries.length ? (
              consoleEntries.map((entry) => (
                <div key={entry.id} className={`studio-log studio-log--${entry.level}`}>
                  <span className="studio-log-level">{entry.level.toUpperCase()}</span>
                  <span className="studio-log-msg">{entry.message}</span>
                  {entry.location ? <span className="studio-log-loc">{entry.location}</span> : null}
                  <span className="studio-log-time">{entry.time}</span>
                </div>
              ))
            ) : (
              <div className="studio-log-empty">{tx("Sin logs aun.", "No logs yet.")}</div>
            )}
          </div>
        </div>
      </details>
    </section>
  );
}
