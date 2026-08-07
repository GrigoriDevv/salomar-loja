import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { loginRequest } from "../../lib/auth-api";
import { isStaffRole } from "./AdminLayout";

export function AdminLoginPage() {
  const navigate = useNavigate();
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
      if (!isStaffRole(session.role)) {
        setError("Acesso restrito a admin/atendente");
        return;
      }
      navigate("/admin/produtos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="admin-page">
      <p className="meta">Painel administrativo</p>
      <h1>Entrar</h1>
      <form className="admin-form" onSubmit={(e) => void submit(e)}>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label>
          <span>Senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="admin-form__error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="meta">
        <Link to="/">Voltar à loja</Link>
      </p>
    </main>
  );
}
