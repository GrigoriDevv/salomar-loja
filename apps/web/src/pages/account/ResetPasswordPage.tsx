import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { resetPasswordRequest } from "../../lib/auth-api";

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError("Link inválido. Solicite uma nova recuperação.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem");
      return;
    }
    setBusy(true);
    try {
      await resetPasswordRequest(token, password);
      navigate("/conta/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao redefinir");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <p className="meta">Área do cliente</p>
      <h1>Nova senha</h1>
      <form className="account-form" onSubmit={(e) => void submit(e)}>
        <label>
          <span>Nova senha</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label>
          <span>Confirmar senha</span>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && (
          <p className="account-form__error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-action" type="submit" disabled={busy}>
          {busy ? "Salvando…" : "Salvar senha"}
        </button>
      </form>
      <p className="meta">
        <Link to="/conta/login">Voltar ao login</Link>
      </p>
    </main>
  );
}
