import { Link, Navigate, Outlet, useLocation } from "react-router";
import {
  clearAccessToken,
  getAccessToken,
  getUserRole,
} from "../../lib/auth-api";

const STAFF = new Set(["admin", "atendente"]);

const NAV = [
  { to: "/admin/produtos", label: "Produtos" },
  { to: "/admin/estoque", label: "Estoque" },
  { to: "/admin/pedidos", label: "Pedidos" },
];

export function isStaffRole(role: string | null | undefined): boolean {
  return Boolean(role && STAFF.has(role));
}

export function AdminLayout() {
  const location = useLocation();
  const token = getAccessToken();
  const role = getUserRole();

  if (!token || !isStaffRole(role)) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return (
    <div className="admin-shell">
      <header className="admin-shell__header">
        <div>
          <p className="meta">Painel</p>
          <h1>Administrativo</h1>
        </div>
        <nav className="admin-shell__nav" aria-label="Admin">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={
                location.pathname.startsWith(item.to)
                  ? "admin-shell__link is-active"
                  : "admin-shell__link"
              }
            >
              {item.label}
            </Link>
          ))}
          <Link to="/" className="admin-shell__link">
            Loja
          </Link>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              clearAccessToken();
              window.location.href = "/admin/login";
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

export function AdminIndexRedirect() {
  return <Navigate to="/admin/produtos" replace />;
}
