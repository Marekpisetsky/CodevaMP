"use client";
/* eslint-disable @next/next/no-img-element */

type VisualesSubaccount = {
  id: string;
  username: string;
  display_name: string | null;
  created_at: string | null;
};

type StudioCustomizePanelProps = {
  tx: (es: string, en: string) => string;
  avatarInitial: string;
  logoPreview: string | null;
  setLogoPreview: (value: string | null) => void;
  settingsName: string;
  setSettingsName: (value: string) => void;
  settingsUsername: string;
  setSettingsUsername: (value: string) => void;
  settingsBio: string;
  setSettingsBio: (value: string) => void;
  settingsMessage: string | null;
  settingsBusy: boolean;
  isOwner: boolean;
  handleSaveSettings: () => void;
  totalSubaccountsLeft: number;
  recentSubaccountsLeft: number;
  subaccountUsername: string;
  setSubaccountUsername: (value: string) => void;
  subaccountDisplayName: string;
  setSubaccountDisplayName: (value: string) => void;
  subaccountBusy: boolean;
  handleCreateSubaccount: () => void;
  subaccountMessage: string | null;
  subaccountsLoading: boolean;
  subaccounts: VisualesSubaccount[];
};

export function StudioCustomizePanel(props: StudioCustomizePanelProps) {
  const {
    tx,
    avatarInitial,
    logoPreview,
    setLogoPreview,
    settingsName,
    setSettingsName,
    settingsUsername,
    setSettingsUsername,
    settingsBio,
    setSettingsBio,
    settingsMessage,
    settingsBusy,
    isOwner,
    handleSaveSettings,
    totalSubaccountsLeft,
    recentSubaccountsLeft,
    subaccountUsername,
    setSubaccountUsername,
    subaccountDisplayName,
    setSubaccountDisplayName,
    subaccountBusy,
    handleCreateSubaccount,
    subaccountMessage,
    subaccountsLoading,
    subaccounts,
  } = props;

  return (
    <section className="studio-settings" id="ajustes">
      <div className="studio-settings__card">
        <div className="studio-settings__header">
          <h3>Ajustes de la cuenta</h3>
          <p>Actualiza tu logo, nombre y datos del estudio.</p>
        </div>
        <div className="studio-settings__grid">
          <label className="studio-settings__field">
            <span>Logo</span>
            <div className="studio-settings__logo">
              <div className="studio-settings__logo-preview visuales-avatar visuales-avatar--square">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo del estudio" />
                ) : (
                  <span>{avatarInitial}</span>
                )}
              </div>
              <label className="studio-settings__logo-action">
                Subir logo
                <input
                  type="file"
                  accept="image/*"
                  disabled={!isOwner}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) {
                      return;
                    }
                    if (logoPreview) {
                      URL.revokeObjectURL(logoPreview);
                    }
                    const nextUrl = URL.createObjectURL(file);
                    setLogoPreview(nextUrl);
                  }}
                />
              </label>
            </div>
          </label>
          <label className="studio-settings__field">
            <span>Nombre completo</span>
            <input
              type="text"
              value={settingsName}
              onChange={(event) => setSettingsName(event.target.value)}
              disabled={!isOwner}
            />
          </label>
          <label className="studio-settings__field">
            <span>Nombre de usuario</span>
            <input
              type="text"
              value={settingsUsername}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\s+/g, "").toLowerCase();
                setSettingsUsername(nextValue);
              }}
              disabled={!isOwner}
            />
          </label>
          <label className="studio-settings__field studio-settings__field--full">
            <span>Bio</span>
            <textarea
              rows={4}
              placeholder={tx("Cuenta tu historia creativa...", "Tell your creative story...")}
              value={settingsBio}
              onChange={(event) => setSettingsBio(event.target.value)}
              disabled={!isOwner}
            />
          </label>
        </div>
        {settingsMessage ? <p className="studio-settings__message">{settingsMessage}</p> : null}
        {!isOwner ? (
          <p className="studio-settings__message">Estas viendo un estudio ajeno.</p>
        ) : null}
        <button
          type="button"
          className="studio-dashboard__action"
          onClick={handleSaveSettings}
          disabled={!isOwner || settingsBusy}
        >
          {settingsBusy ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
      <div className="studio-settings__card">
        <div className="studio-settings__header">
          <h3>Subcuentas Visuales</h3>
          <p>
            Crea cuentas adicionales sin cambiar correo. Limites: 10 totales, 3 nuevas cada 6 meses.
          </p>
        </div>
        <div className="studio-subaccounts__quota">
          <span>Total disponible: {totalSubaccountsLeft}</span>
          <span>Disponibles este semestre: {recentSubaccountsLeft}</span>
        </div>
        <div className="studio-settings__grid">
          <label className="studio-settings__field">
            <span>Usuario de subcuenta</span>
            <input
              value={subaccountUsername}
              placeholder={tx("ejemplo-cuenta", "example-account")}
              disabled={!isOwner || subaccountBusy}
              onChange={(event) => setSubaccountUsername(event.target.value)}
            />
          </label>
          <label className="studio-settings__field">
            <span>Nombre visible</span>
            <input
              value={subaccountDisplayName}
              placeholder={tx("Nombre para mostrar", "Display name")}
              disabled={!isOwner || subaccountBusy}
              onChange={(event) => setSubaccountDisplayName(event.target.value)}
            />
          </label>
        </div>
        <button
          type="button"
          className="studio-dashboard__action"
          onClick={handleCreateSubaccount}
          disabled={!isOwner || subaccountBusy || totalSubaccountsLeft <= 0 || recentSubaccountsLeft <= 0}
        >
          {subaccountBusy ? "Creando..." : "Crear subcuenta"}
        </button>
        {subaccountMessage ? <p className="studio-settings__message">{subaccountMessage}</p> : null}
        {subaccountsLoading ? (
          <p className="studio-projects__hint">Cargando subcuentas...</p>
        ) : subaccounts.length === 0 ? (
          <p className="studio-projects__hint">No tienes subcuentas creadas.</p>
        ) : (
          <div className="studio-subaccounts">
            {subaccounts.map((account) => (
              <article key={account.id} className="studio-subaccounts__item">
                <div>
                  <strong>@{account.username}</strong>
                  <p>{account.display_name || "Sin nombre visible"}</p>
                </div>
                <span>
                  {account.created_at
                    ? new Date(account.created_at).toLocaleDateString()
                    : "Fecha no disponible"}
                </span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

