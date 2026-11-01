import { Link, Navigate, Outlet, useLocation } from "react-router";
import { hasSession, logoutRequest } from "../../lib/auth-api";

const NAV = [
  { to: "/conta/pedidos", label: "Pedidos" },
  { to: "/conta/dados", label: "Meus dados" },
];

export function AccountLayout() {
  const location = useLocation();
  if (!hasSession()) {
    return <Navigate to="/conta/login" replace state={{ from: location }} />;
  }

  return (
    <div className="account-shell">
      <header className="account-shell__header">
        <div>
          <p className="meta">Área do cliente</p>
          <h1>Minha conta</h1>
        </div>
        <nav className="account-shell__nav" aria-label="Conta">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                location.pathname === item.to
                  ? "account-shell__link is-active"
                  : "account-shell__link"
              }
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="account-shell__link">
            Loja
          </Link>
          <button
            type="button"
            className="text-link"
            onClick={async () => {
              await logoutRequest().catch(() => undefined);
              window.location.href = "/conta/login";
            }}
          >
            Sair
          </button>
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

export function AccountIndexRedirect() {
  return <Navigate to="/conta/pedidos" replace />;
}
