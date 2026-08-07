import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { registerRequest } from "../../lib/auth-api";
import { syncCartOnLogin } from "../../lib/sync-login";
import { useCart } from "../../state/store";

export function RegisterPage() {
  const navigate = useNavigate();
  const { items, replaceItems } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (name.trim().length < 2) {
      setError("Informe seu nome");
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
      const session = await registerRequest({
        name: name.trim(),
        email: email.trim(),
        password,
      });
      await syncCartOnLogin(session.accessToken, items, replaceItems);
      navigate("/conta/pedidos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no cadastro");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="account-page">
      <p className="meta">Área do cliente</p>
      <h1>Criar conta</h1>
      <form className="account-form" onSubmit={(e) => void submit(e)} noValidate>
        <label>
          <span>Nome</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
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
          {busy ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="meta">
        Já tem conta? <Link to="/conta/login">Entrar</Link>
      </p>
    </main>
  );
}
