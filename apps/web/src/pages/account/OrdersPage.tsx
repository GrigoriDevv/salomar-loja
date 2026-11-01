import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatPrice } from "../../data/catalog";
import { listMyOrders, type MyOrderSummary } from "../../lib/orders-api";

function orderBadge(order: MyOrderSummary): string {
  if (order.status === "delivered") return "Entregue";
  if (order.status === "shipped") return "Enviado";
  if (order.status === "paid" || order.paymentStatus === "approved") {
    return "Pago";
  }
  if (order.status === "failed" || order.paymentStatus === "rejected") {
    return "Falhou";
  }
  if (order.status === "canceled") return "Cancelado";
  return "Pendente";
}

export function OrdersPage() {
  const [orders, setOrders] = useState<MyOrderSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const rows = await listMyOrders();
        if (!cancelled) setOrders(rows);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="account-section">
      <h2>Histórico de pedidos</h2>
      {loading && <p className="meta">Carregando…</p>}
      {error && (
        <p className="account-form__error" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && orders.length === 0 && (
        <p className="meta">
          Você ainda não tem pedidos. <Link to="/">Continuar comprando</Link>
        </p>
      )}
      <ul className="account-orders">
        {orders.map((order) => (
          <li key={order.id} className="account-orders__item">
            <div>
              <strong>#{order.id.slice(-8).toUpperCase()}</strong>
              <p className="meta">
                {new Date(order.createdAt).toLocaleString("pt-BR")}
              </p>
              {order.trackingCode && (
                <p className="meta">
                  Rastreio: <strong>{order.trackingCode}</strong> ·{" "}
                  <a
                    href="https://rastreamento.correios.com.br"
                    target="_blank"
                    rel="noreferrer"
                  >
                    acompanhar nos Correios
                  </a>
                </p>
              )}
            </div>
            <div className="account-orders__meta">
              <span>{formatPrice(order.totalCents / 100)}</span>
              <span className="account-orders__badge">{orderBadge(order)}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
