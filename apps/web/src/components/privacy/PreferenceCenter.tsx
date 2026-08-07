import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  getPreferences,
  PRIVACY_CENTER_EVENT,
  savePreferences,
} from "../../lib/consent";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function PreferenceCenter({ open, onClose }: Props) {
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const prefs = getPreferences();
    setAnalytics(prefs?.analytics ?? false);
    setMarketing(prefs?.marketing ?? false);
    setSaved(false);
    closeRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await savePreferences({ analytics, marketing });
      setSaved(true);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="privacy-modal" role="presentation">
      <button
        type="button"
        className="privacy-modal__backdrop"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        className="privacy-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="privacy-modal__header">
          <h2 id={titleId}>Central de preferências</h2>
          <button
            ref={closeRef}
            type="button"
            className="text-link"
            onClick={onClose}
          >
            Fechar
          </button>
        </header>
        <p className="privacy-modal__lead">
          Altere a qualquer momento. Cookies necessários permanecem ativos para
          login, carrinho e checkout.{" "}
          <Link to="/privacidade" onClick={onClose}>
            Ver política
          </Link>
        </p>
        <form className="privacy-modal__form" onSubmit={(e) => void onSave(e)}>
          <label className="cookie-toggle">
            <input type="checkbox" checked disabled readOnly />
            <span>
              <strong>Necessários</strong>
              <em>Autenticação, sessão e segurança</em>
            </span>
          </label>
          <label className="cookie-toggle">
            <input
              type="checkbox"
              checked={analytics}
              disabled={busy}
              onChange={(e) => setAnalytics(e.target.checked)}
            />
            <span>
              <strong>Analytics</strong>
              <em>Medição agregada de uso — pode desativar agora</em>
            </span>
          </label>
          <label className="cookie-toggle">
            <input
              type="checkbox"
              checked={marketing}
              disabled={busy}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span>
              <strong>Marketing</strong>
              <em>Comunicações e remarketing — opt-out imediato</em>
            </span>
          </label>
          <div className="privacy-modal__actions">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => {
                setAnalytics(false);
                setMarketing(false);
              }}
            >
              Desmarcar opcionais
            </button>
            <button type="submit" className="primary-action" disabled={busy}>
              {busy ? "Salvando…" : "Salvar preferências"}
            </button>
          </div>
          {saved && (
            <p className="account-form__ok" role="status">
              Preferências atualizadas
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

export function usePrivacyCenterOpen() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener(PRIVACY_CENTER_EVENT, handler);
    return () => window.removeEventListener(PRIVACY_CENTER_EVENT, handler);
  }, []);

  return { open, setOpen, openCenter: () => setOpen(true) };
}
