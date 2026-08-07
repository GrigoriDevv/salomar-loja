import { useEffect, useState, type FormEvent } from "react";
import {
  createAdminProduct,
  deleteAdminProduct,
  listAdminCategories,
  listAdminProducts,
  updateAdminProduct,
  type AdminCategory,
  type AdminProduct,
  type ProductInput,
} from "../../lib/admin-api";

const emptyForm: ProductInput = {
  slug: "",
  name: "",
  subtitle: "",
  categoryId: "",
  material: "",
  fit: "",
  tone: "",
  image: "/catalog/editorial-por-do-sol.jpg",
  alt: "",
  focus: "50% 50%",
  intents: ["essenciais"],
  priceCents: 0,
  variants: [{ size: "M", color: "único", stock: 0 }],
};

export function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductInput>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    const [p, c] = await Promise.all([
      listAdminProducts(),
      listAdminCategories(),
    ]);
    setProducts(p);
    setCategories(c);
    if (!form.categoryId && c[0]) {
      setForm((f) => ({ ...f, categoryId: c[0].id }));
    }
  };

  useEffect(() => {
    void reload().catch((err) =>
      setError(err instanceof Error ? err.message : "Falha ao carregar"),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const startEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setForm({
      slug: product.slug,
      name: product.name,
      subtitle: product.subtitle,
      categoryId: product.categoryId,
      material: product.material,
      fit: product.fit,
      tone: product.tone,
      image: product.image,
      alt: product.alt,
      focus: product.focus,
      intents: product.intents,
      priceCents: product.priceCents,
      variants: product.variants.map((v) => ({
        size: v.size,
        color: v.color,
        stock: v.stock,
      })),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      categoryId: categories[0]?.id ?? "",
    });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const payload = {
        ...form,
        intents: form.intents.length ? form.intents : ["essenciais"],
        priceCents: Number(form.priceCents),
      };
      if (editingId) {
        await updateAdminProduct(editingId, payload);
      } else {
        await createAdminProduct(payload);
      }
      resetForm();
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      await deleteAdminProduct(id);
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao remover");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="admin-section">
      <h2>Produtos</h2>
      {error && (
        <p className="admin-form__error" role="alert">
          {error}
        </p>
      )}

      <ul className="admin-list">
        {products.map((product) => (
          <li key={product.id}>
            <div>
              <strong>{product.name}</strong>
              <p className="meta">
                {product.slug} · {(product.priceCents / 100).toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}{" "}
                · {product.active ? "ativo" : "inativo"}
              </p>
            </div>
            <div className="admin-list__actions">
              <button
                type="button"
                className="text-link"
                onClick={() => startEdit(product)}
              >
                Editar
              </button>
              <button
                type="button"
                className="text-link"
                disabled={busy || !product.active}
                onClick={() => void remove(product.id)}
              >
                Desativar
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form className="admin-form" onSubmit={(e) => void submit(e)}>
        <h3>{editingId ? "Editar produto" : "Novo produto"}</h3>
        <label>
          <span>Nome</span>
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Slug</span>
          <input
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          />
        </label>
        <label>
          <span>Subtítulo</span>
          <input
            value={form.subtitle}
            onChange={(e) => set("subtitle", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Categoria</span>
          <select
            value={form.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            required
          >
            <option value="">Selecione</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-form__row">
          <label>
            <span>Material</span>
            <input
              value={form.material}
              onChange={(e) => set("material", e.target.value)}
              required
            />
          </label>
          <label>
            <span>Fit</span>
            <input
              value={form.fit}
              onChange={(e) => set("fit", e.target.value)}
              required
            />
          </label>
        </div>
        <div className="admin-form__row">
          <label>
            <span>Tone / cor base</span>
            <input
              value={form.tone}
              onChange={(e) => set("tone", e.target.value)}
              required
            />
          </label>
          <label>
            <span>Preço (centavos)</span>
            <input
              type="number"
              min={0}
              value={form.priceCents}
              onChange={(e) => set("priceCents", Number(e.target.value))}
              required
            />
          </label>
        </div>
        <label>
          <span>Imagem (URL/path)</span>
          <input
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Alt</span>
          <input
            value={form.alt}
            onChange={(e) => set("alt", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Focus</span>
          <input
            value={form.focus}
            onChange={(e) => set("focus", e.target.value)}
            required
          />
        </label>
        <label>
          <span>Intents (csv)</span>
          <input
            value={form.intents.join(",")}
            onChange={(e) =>
              set(
                "intents",
                e.target.value
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              )
            }
          />
        </label>
        <label>
          <span>Variantes (size|color|stock por linha)</span>
          <textarea
            rows={4}
            value={form.variants
              .map((v) => `${v.size}|${v.color}|${v.stock}`)
              .join("\n")}
            onChange={(e) => {
              const variants = e.target.value
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line) => {
                  const [size, color, stock] = line.split("|");
                  return {
                    size: size?.trim() || "M",
                    color: color?.trim() || form.tone || "único",
                    stock: Number(stock) || 0,
                  };
                });
              set("variants", variants.length ? variants : emptyForm.variants);
            }}
          />
        </label>
        <div className="admin-form__actions">
          <button className="primary-action" type="submit" disabled={busy}>
            {busy ? "Salvando…" : editingId ? "Atualizar" : "Criar"}
          </button>
          {editingId && (
            <button type="button" className="text-link" onClick={resetForm}>
              Cancelar edição
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
