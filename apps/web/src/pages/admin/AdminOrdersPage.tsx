import { useEffect, useState } from "react";
import {
  formatShippingAddress,
  listAdminOrders,
  updateAdminOrderStatus,
  type AdminOrder,
} from "../../lib/admin-api";

const STATUSES = [
  "",
  "pending",
  "paid",
  "shipped",
  "delivered",
  "canceled",
  "failed",
] as const;

const STATUS_LABEL: Record<string, string> = {
  "": "todos",
  pending: "pendente",
  paid: "pago",
  shipped: "enviado",
  delivered: "entregue",
  canceled: "cancelado",
  failed: "falhou",
};

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

  const changeStatus = async (order: AdminOrder, next: string) => {
    let trackingCode: string | undefined;
    if (next === "shipped") {
      const input = window.prompt(
        "Código de rastreio dos Correios (o cliente recebe por e-mail):",
        order.trackingCode ?? "",
      );
      if (!input?.trim()) return;
      trackingCode = input.trim();
    }
    const id = order.id;
    setBusyId(id);
    setError(null);
    try {
      await updateAdminOrderStatus(id, next, undefined, trackingCode);
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
              {STATUS_LABEL[s]}
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
              <strong>#{order.id.slice(-8).toUpperCase()}</strong>
              <p className="meta">
                {order.customer?.email ?? "sem cliente"} ·{" "}
                {(order.totalCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}{" "}
                · {new Date(order.createdAt).toLocaleString("pt-BR")} ·{" "}
                {order.itemsCount} {order.itemsCount === 1 ? "item" : "itens"}
                {order.paymentStatus
                  ? ` · pagamento ${order.paymentStatus}`
                  : ""}
              </p>
              <p className="meta">
                Entrega
                {order.shipping.recipient
                  ? ` para ${order.shipping.recipient}`
                  : ""}
                {order.shipping.serviceCode
                  ? ` (${order.shipping.serviceCode})`
                  : ""}
                :{" "}
                {formatShippingAddress(order.shipping) ||
                  "endereço não informado"}
              </p>
              {order.trackingCode && (
                <p className="meta">Rastreio: {order.trackingCode}</p>
              )}
            </div>
            <div className="admin-list__actions">
              <select
                value={order.status}
                disabled={busyId === order.id}
                onChange={(e) => void changeStatus(order, e.target.value)}
              >
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </li>
        ))}
      </ul>
      {orders.length === 0 && (
        <p className="meta">Nenhum pedido neste filtro.</p>
      )}
    </section>
  );
}
