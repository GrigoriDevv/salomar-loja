import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { forgotPasswordRequest } from "../../lib/auth-api";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setBusy(true);
    try {
      const msg = await forgotPasswordRequest(email.trim());
      setMessage(msg);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha na solicitação");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <p className="meta">Área do cliente</p>
      <h1>Recuperar senha</h1>
      <form className="account-form" onSubmit={(e) => void submit(e)}>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        {error && (
          <p className="account-form__error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="account-form__ok" role="status">
            {message}
          </p>
        )}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "Enviando…" : "Enviar link"}
        </button>
      </form>
      <p className="meta">
        <Link to="/conta/login">Voltar ao login</Link>
      </p>
    </main>
  );
}
