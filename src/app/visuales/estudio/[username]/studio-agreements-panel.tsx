"use client";

type StudioTermsAcceptance = {
  accepted: boolean;
  acceptedAt: string | null;
  version: string;
};

type StudioAgreementsPanelProps = {
  wantsMonetization: boolean;
  setActiveSection: (section: "preferencias") => void;
  termsVersion: string;
  termsAcceptance: StudioTermsAcceptance;
  termsLoading: boolean;
  isTermsAccepted: boolean;
  isOwner: boolean;
  termsAccepting: boolean;
  handleAcceptTerms: () => Promise<void>;
};

export function StudioAgreementsPanel(props: StudioAgreementsPanelProps) {
  const {
    wantsMonetization,
    setActiveSection,
    termsVersion,
    termsAcceptance,
    termsLoading,
    isTermsAccepted,
    isOwner,
    termsAccepting,
    handleAcceptTerms,
  } = props;

  return (
    <section className="studio-settings">
      <div className="studio-settings__card">
        <div className="studio-settings__header">
          <h3>Contrato de uso y pagos</h3>
          <p>Este contrato solo aplica cuando decides monetizar contenido.</p>
        </div>
        {!wantsMonetization ? (
          <div className="studio-contract-block">
            <p>Este contrato solo se aplica cuando monetizas. Si solo publicas sin cobrar, no necesitas aceptarlo.</p>
            <button
              type="button"
              className="studio-dashboard__action studio-dashboard__action--ghost"
              onClick={() => setActiveSection("preferencias")}
            >
              Configurar en Preferencias
            </button>
          </div>
        ) : (
          <>
            <div className="studio-contract">
              <h4>Condiciones principales</h4>
              <ul>
                <li>Los pagos se habilitan solo para cuentas verificadas y con actividad legitima.</li>
                <li>El contenido subido debe respetar derechos de autor y normas de la plataforma.</li>
                <li>Las estimaciones de ingresos son orientativas y pueden ajustarse por revision interna.</li>
                <li>El estudio acepta cumplir politicas anti-fraude y de uso responsable.</li>
              </ul>
              <p>
                Version del contrato: <strong>{termsVersion}</strong>
              </p>
              {termsAcceptance.acceptedAt ? (
                <p>
                  Aceptado el: <strong>{new Date(termsAcceptance.acceptedAt).toLocaleString()}</strong>
                </p>
              ) : null}
            </div>
            {termsLoading ? (
              <p className="studio-projects__hint">Verificando estado de contrato...</p>
            ) : isTermsAccepted ? (
              <p className="studio-contract__ok">Contrato aceptado. Pagos habilitado.</p>
            ) : (
              <button
                type="button"
                className="studio-dashboard__action"
                disabled={!isOwner || termsAccepting}
                onClick={handleAcceptTerms}
              >
                {termsAccepting ? "Aceptando..." : "Aceptar contrato"}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

