import { useEffect, useId, useState, type FormEvent } from "react";
import { Link } from "react-router";
import {
  getPreferences,
  savePreferences,
  type ConsentPreferences,
} from "../../lib/consent";

type Props = {
  onOpenPreferences: () => void;
};

export function CookieBanner({ onOpenPreferences }: Props) {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const titleId = useId();

  useEffect(() => {
    setVisible(getPreferences() === null);
  }, []);

  useEffect(() => {
    const onUpdated = () => setVisible(false);
    window.addEventListener("salomar:consent-updated", onUpdated);
    return () =>
      window.removeEventListener("salomar:consent-updated", onUpdated);
  }, []);

  if (!visible) return null;

  const persist = async (next: {
    analytics: boolean;
    marketing: boolean;
  }) => {
    setBusy(true);
    try {
      await savePreferences(next);
      setVisible(false);
    } finally {
      setBusy(false);
    }
  };

  const onSave = (e: FormEvent) => {
    e.preventDefault();
    void persist({ analytics, marketing });
  };

  return (
    <div
      className="cookie-banner"
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
    >
      <div className="cookie-banner__inner">
        <div className="cookie-banner__copy">
          <h2 id={titleId}>Cookies e privacidade</h2>
          <p>
            Usamos cookies necessários para a loja funcionar. Analytics e
            marketing só com o seu aceite.{" "}
            <Link to="/privacidade">Política de privacidade</Link>
          </p>
        </div>

        <form className="cookie-banner__form" onSubmit={onSave}>
          <label className="cookie-toggle">
            <input type="checkbox" checked disabled readOnly />
            <span>
              <strong>Necessários</strong>
              <em>Sempre ativos</em>
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
              <em>Métricas e melhoria</em>
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
              <em>Comunicações e anúncios</em>
            </span>
          </label>

          <div className="cookie-banner__actions">
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={() => void persist({ analytics: false, marketing: false })}
            >
              Recusar opcionais
            </button>
            <button
              type="button"
              className="text-link"
              disabled={busy}
              onClick={onOpenPreferences}
            >
              Preferências
            </button>
            <button
              type="button"
              className="primary-action"
              disabled={busy}
              onClick={() =>
                void persist({ analytics: true, marketing: true })
              }
            >
              Aceitar todos
            </button>
            <button
              type="submit"
              className="primary-action"
              disabled={busy}
            >
              Salvar escolhas
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type { ConsentPreferences };
