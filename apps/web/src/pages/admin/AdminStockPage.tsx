import { useEffect, useMemo, useState } from "react";
import {
  listAdminProducts,
  updateVariantStock,
  type AdminProduct,
} from "../../lib/admin-api";

type StockRow = {
  productId: string;
  productName: string;
  variantId: string;
  size: string;
  color: string;
  stock: number;
};

export function AdminStockPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [drafts, setDrafts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const reload = async () => {
    const rows = await listAdminProducts();
    setProducts(rows);
  };

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Falha ao carregar"),
    );
  }, []);

  const rows = useMemo<StockRow[]>(
    () =>
      products.flatMap((product) =>
        product.variants.map((variant) => ({
          productId: product.id,
          productName: product.name,
          variantId: variant.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
        })),
      ),
    [products],
  );

  const save = async (row: StockRow) => {
    const stock = drafts[row.variantId] ?? row.stock;
    setBusyId(row.variantId);
    setError(null);
    try {
      await updateVariantStock(row.productId, row.variantId, Number(stock));
      await reload();
      setDrafts((d) => {
        const next = { ...d };
        delete next[row.variantId];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar estoque");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="admin-section">
      <h2>Estoque</h2>
      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Tamanho</th>
              <th>Cor</th>
              <th>Estoque</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variantId}>
                <td>{row.productName}</td>
                <td>{row.size}</td>
                <td>{row.color}</td>
                <td>
                  <input
                    type="number"
                    min={0}
                    className="admin-table__stock"
                    value={drafts[row.variantId] ?? row.stock}
                    onChange={(e) =>
                      setDrafts((d) => ({
                        ...d,
                        [row.variantId]: Number(e.target.value),
                      }))
                    }
                  />
                </td>
                <td>
                  <button
                    type="button"
                    className="text-link"
                    disabled={busyId === row.variantId}
                    onClick={() => void save(row)}
                  >
                    Salvar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
