import { useState, type FormEvent } from "react";
import { loginRequest } from "../lib/auth-api";
import { syncCartOnLogin } from "../lib/sync-login";
import { useCart } from "../state/store";

type LoginFormProps = {
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function LoginForm({ onSuccess, onCancel }: LoginFormProps) {
  const { items, replaceItems } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const session = await loginRequest(email, password);
      await syncCartOnLogin(session.accessToken, items, replaceItems);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="login-form" onSubmit={submit} aria-label="Entrar na conta">
      <p className="meta">Entre para sincronizar a sacola</p>
      <label>
        <span>E-mail</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        <span>Senha</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && (
        <p className="login-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="login-form__actions">
        <button type="submit" className="primary-action" disabled={busy}>
          {busy ? "Entrando…" : "Entrar e sincronizar"}
        </button>
        {onCancel && (
          <button type="button" className="text-link" onClick={onCancel}>
            Agora não
          </button>
        )}
      </div>
    </form>
  );
}
