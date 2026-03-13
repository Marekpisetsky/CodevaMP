"use client";

type StudioPreferences = {
  autoplayPreview: boolean;
  compactProjectGrid: boolean;
  reopenLastSection: boolean;
  keyboardShortcuts: boolean;
};

type StudioPreferencesPanelProps = {
  wantsMonetization: boolean;
  isOwner: boolean;
  setWantsMonetization: (value: boolean) => void;
  preferences: StudioPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<StudioPreferences>>;
  showNotice: (tone: "ok" | "warn", text: string) => void;
};

export function StudioPreferencesPanel(props: StudioPreferencesPanelProps) {
  const { wantsMonetization, isOwner, setWantsMonetization, preferences, setPreferences, showNotice } = props;

  return (
    <section className="studio-settings">
      <div className="studio-settings__card">
        <div className="studio-settings__header">
          <h3>Preferencias</h3>
          <p>Opciones generales del estudio.</p>
        </div>
        <div className="studio-prefs">
          <label className="studio-prefs__item">
            <div>
              <strong>Monetizacion</strong>
              <p>Activa o desactiva pagos y contrato para este estudio.</p>
            </div>
            <input
              type="checkbox"
              checked={wantsMonetization}
              disabled={!isOwner}
              onChange={(event) => {
                const nextValue = event.target.checked;
                setWantsMonetization(nextValue);
                showNotice(
                  "ok",
                  nextValue
                    ? "Monetizacion activada. Revisa Contrato para habilitar pagos."
                    : "Monetizacion desactivada. Pagos y contrato quedan en modo informativo."
                );
              }}
            />
          </label>
          <label className="studio-prefs__item">
            <div>
              <strong>Autoplay en previews de video</strong>
              <p>Reproduce miniaturas de video automaticamente en Proyectos.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.autoplayPreview}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, autoplayPreview: event.target.checked }))
              }
            />
          </label>
          <label className="studio-prefs__item">
            <div>
              <strong>Vista compacta de grilla</strong>
              <p>Muestra mas tarjetas por fila en la seccion de proyectos.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.compactProjectGrid}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, compactProjectGrid: event.target.checked }))
              }
            />
          </label>
          <label className="studio-prefs__item">
            <div>
              <strong>Reabrir ultima seccion</strong>
              <p>Al volver al estudio, recuerda la seccion activa.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.reopenLastSection}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, reopenLastSection: event.target.checked }))
              }
            />
          </label>
          <label className="studio-prefs__item">
            <div>
              <strong>Atajos de teclado</strong>
              <p>Usa 1-6 para secciones, / para buscar y Esc para cerrar paneles.</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.keyboardShortcuts}
              onChange={(event) =>
                setPreferences((prev) => ({ ...prev, keyboardShortcuts: event.target.checked }))
              }
            />
          </label>
        </div>
        <p className="studio-projects__hint">Preferencias guardadas localmente en este navegador.</p>
      </div>
    </section>
  );
}

