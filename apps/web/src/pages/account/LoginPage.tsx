import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { loginRequest } from "../../lib/auth-api";
import { syncCartOnLogin } from "../../lib/sync-login";
import { useCart } from "../../state/store";

export function LoginPage() {
  const navigate = useNavigate();
  const { items, replaceItems } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const session = await loginRequest(email.trim(), password);
      await syncCartOnLogin(session.accessToken, items, replaceItems);
      navigate("/conta/pedidos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <p className="meta">Área do cliente</p>
      <h1>Entrar</h1>
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
        <label>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && (
          <p className="account-form__error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="meta">
        <Link to="/conta/recuperar">Esqueci minha senha</Link>
        {" · "}
        <Link to="/conta/cadastro">Criar conta</Link>
      </p>
    </main>
  );
}
