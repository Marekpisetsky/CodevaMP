"use client";

type StudioPayoutMethod = "paypal" | "bank" | "crypto";

type StudioPayoutSettings = {
  method: StudioPayoutMethod;
  destination: string;
  minPayout: number;
};

type PayoutRow = {
  id: string;
  title: string;
  views: number;
  likes: number;
  shares: number;
  estimate: number;
};

type StudioPayoutsPanelProps = {
  tx: (es: string, en: string) => string;
  wantsMonetization: boolean;
  isTermsAccepted: boolean;
  setActiveSection: (section: "preferencias" | "acuerdos") => void;
  payoutSummary: {
    gross: number;
    pending: number;
    available: number;
  };
  payoutSettings: StudioPayoutSettings;
  setPayoutSettings: React.Dispatch<React.SetStateAction<StudioPayoutSettings>>;
  isOwner: boolean;
  payoutSaving: boolean;
  handleSavePayoutSettings: () => Promise<void>;
  showNotice: (tone: "ok" | "warn", text: string) => void;
  payoutRows: PayoutRow[];
  formatCompactMetric: (value: number) => string;
  defaultMinPayout: number;
};

export function StudioPayoutsPanel(props: StudioPayoutsPanelProps) {
  const {
    tx,
    wantsMonetization,
    isTermsAccepted,
    setActiveSection,
    payoutSummary,
    payoutSettings,
    setPayoutSettings,
    isOwner,
    payoutSaving,
    handleSavePayoutSettings,
    showNotice,
    payoutRows,
    formatCompactMetric,
    defaultMinPayout,
  } = props;

  return (
    <section className="studio-settings">
      <div className="studio-settings__card">
        <div className="studio-settings__header">
          <h3>Resumen de pagos</h3>
          <p>Estimacion basada en rendimiento de tus proyectos publicados.</p>
        </div>
        {!wantsMonetization ? (
          <div className="studio-contract-block">
            <p>La monetizacion esta desactivada. Activala en Preferencias solo si quieres cobrar por tu contenido.</p>
            <button
              type="button"
              className="studio-dashboard__action studio-dashboard__action--ghost"
              onClick={() => setActiveSection("preferencias")}
            >
              Ir a Preferencias
            </button>
          </div>
        ) : !isTermsAccepted ? (
          <div className="studio-contract-block">
            <p>Para activar pagos, primero acepta el contrato en la seccion Contrato.</p>
            <button
              type="button"
              className="studio-dashboard__action studio-dashboard__action--ghost"
              onClick={() => setActiveSection("acuerdos")}
            >
              Ir a Contrato
            </button>
          </div>
        ) : null}
        {wantsMonetization && isTermsAccepted ? (
          <>
            <div className="studio-payout-cards">
              <article>
                <span>Disponible</span>
                <strong>US$ {payoutSummary.available.toFixed(2)}</strong>
              </article>
              <article>
                <span>Pendiente</span>
                <strong>US$ {payoutSummary.pending.toFixed(2)}</strong>
              </article>
              <article>
                <span>Total estimado</span>
                <strong>US$ {payoutSummary.gross.toFixed(2)}</strong>
              </article>
            </div>
            <div className="studio-settings__grid">
              <label className="studio-settings__field">
                <span>Metodo de cobro</span>
                <select
                  value={payoutSettings.method}
                  disabled={!isOwner}
                  onChange={(event) =>
                    setPayoutSettings((prev) => ({
                      ...prev,
                      method: event.target.value as StudioPayoutMethod,
                    }))
                  }
                >
                  <option value="paypal">PayPal</option>
                  <option value="bank">Transferencia bancaria</option>
                  <option value="crypto">Crypto (USDT)</option>
                </select>
              </label>
              <label className="studio-settings__field">
                <span>Destino</span>
                <input
                  value={payoutSettings.destination}
                  disabled={!isOwner}
                  placeholder={tx("correo, IBAN o wallet", "email, IBAN, or wallet")}
                  onChange={(event) =>
                    setPayoutSettings((prev) => ({ ...prev, destination: event.target.value }))
                  }
                />
              </label>
              <label className="studio-settings__field">
                <span>Minimo para retiro (USD)</span>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  value={payoutSettings.minPayout}
                  disabled={!isOwner}
                  onChange={(event) =>
                    setPayoutSettings((prev) => ({
                      ...prev,
                      minPayout: Number(event.target.value || defaultMinPayout),
                    }))
                  }
                />
              </label>
            </div>
            <div className="studio-payout-actions">
              <button
                type="button"
                className="studio-dashboard__action"
                onClick={handleSavePayoutSettings}
                disabled={!isOwner || payoutSaving}
              >
                {payoutSaving ? "Guardando..." : "Guardar configuracion"}
              </button>
              <button
                type="button"
                className="studio-dashboard__action studio-dashboard__action--ghost"
                disabled={!isOwner || payoutSummary.available < payoutSettings.minPayout}
                onClick={() => {
                  if (payoutSummary.available < payoutSettings.minPayout) {
                    showNotice("warn", "Aun no llegas al minimo de retiro.");
                    return;
                  }
                  showNotice("ok", "Solicitud de retiro registrada.");
                }}
              >
                Solicitar retiro
              </button>
            </div>
            <div className="studio-payout-table">
              <div className="studio-payout-table__head">
                <strong>Proyecto</strong>
                <strong>Vistas</strong>
                <strong>Interacciones</strong>
                <strong>Estimado</strong>
              </div>
              {payoutRows.length === 0 ? (
                <p className="studio-projects__hint">Publica proyectos para ver estimaciones de pago.</p>
              ) : (
                payoutRows.slice(0, 8).map((row) => (
                  <div key={row.id} className="studio-payout-table__row">
                    <span>{row.title}</span>
                    <span>{formatCompactMetric(row.views)}</span>
                    <span>{formatCompactMetric(row.likes + row.shares)}</span>
                    <span>US$ {row.estimate.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

