import { useEffect, useState } from "react";
import {
  listAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
} from "../../lib/admin-api";

const STATUSES = ["", "pending", "paid", "canceled", "failed"] as const;

export function AdminOrdersPage() {
  const [status, setStatus] = useState<string>("");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async (filter = status) => {
    const result = await listAdminOrders(filter || undefined);
    setOrders(result.data);
  };

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Falha ao carregar"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const changeStatus = async (id: string, next: string) => {
    setBusyId(id);
    setError(null);
    try {
      await updateAdminOrderStatus(id, next);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="admin-section">
      <h2>Pedidos</h2>
      <label className="admin-filter">
        <span>Status</span>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s || "todos"}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}
      <ul className="admin-list">
        {orders.map((order) => (
          <li key={order.id}>
            <div>
              <strong>{order.id.slice(0, 10)}…</strong>
              <p className="meta">
                {order.user?.email ?? "sem cliente"} ·{" "}
                {(order.totalCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}{" "}
                · {new Date(order.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="admin-list__actions">
              <select
                value={order.status}
                disabled={busyId === order.id}
                onChange={(e) => void changeStatus(order.id, e.target.value)}
              >
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
      {orders.length === 0 && <p className="meta">Nenhum pedido neste filtro.</p>}
    </section>
  );
}
