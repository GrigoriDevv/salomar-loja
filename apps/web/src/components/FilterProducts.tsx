import type { ProductFilters } from "../lib/filters";
import type { collectFilterOptions } from "../lib/collectFilterOptions";

type FilterOptions = ReturnType<typeof collectFilterOptions>;

interface ProductFiltersBarProps {
  filters: ProductFilters;
  options: FilterOptions;
  result: number;
  onChange: (next: ProductFilters) => void;
  onClear: () => void;
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

function emptyToNumber(value: string): number | null {
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function ProductFiltersBar({
  filters,
  options,
  result,
  onChange,
  onClear,
}: ProductFiltersBarProps) {
  const hasActiveFilter =
    filters.category !== null ||
    filters.size !== null ||
    filters.tone !== null ||
    filters.priceMin !== null ||
    filters.priceMax !== null;

  return (
    <form
      className="product-filters"
      aria-label="Refinar a coleção"
      onSubmit={(event) => event.preventDefault()}
    >
      <label className="product-filters__field">
        <span>Categoria</span>
        <select
          value={filters.category ?? ""}
          onChange={(event) =>
            onChange({ ...filters, category: emptyToNull(event.target.value) })
          }
        >
          <option value="">Todas</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="product-filters__field">
        <span>Tamanho</span>
        <select
          value={filters.size ?? ""}
          onChange={(event) =>
            onChange({ ...filters, size: emptyToNull(event.target.value) })
          }
        >
          <option value="">Todos</option>
          {options.sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>

      <label className="product-filters__field">
        <span>Tom</span>
        <select
          value={filters.tone ?? ""}
          onChange={(event) =>
            onChange({ ...filters, tone: emptyToNull(event.target.value) })
          }
        >
          <option value="">Todos</option>
          {options.tones.map((tone) => (
            <option key={tone} value={tone}>
              {tone}
            </option>
          ))}
        </select>
      </label>

      <label className="product-filters__field">
        <span>Preço mín.</span>
        <input
          type="number"
          inputMode="decimal"
          min={options.priceBounds.min}
          max={options.priceBounds.max}
          step="1"
          placeholder={String(options.priceBounds.min)}
          value={filters.priceMin ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              priceMin: emptyToNumber(event.target.value),
            })
          }
        />
      </label>

      <label className="product-filters__field">
        <span>Preço máx.</span>
        <input
          type="number"
          inputMode="decimal"
          min={options.priceBounds.min}
          max={options.priceBounds.max}
          step="1"
          placeholder={String(options.priceBounds.max)}
          value={filters.priceMax ?? ""}
          onChange={(event) =>
            onChange({
              ...filters,
              priceMax: emptyToNumber(event.target.value),
            })
          }
        />
      </label>

      <div className="product-filters__meta">
        <p aria-live="polite">
          {result} {result === 1 ? "peça" : "peças"}
        </p>
        {hasActiveFilter && (
          <button type="button" className="text-link" onClick={onClear}>
            Limpar
          </button>
        )}
      </div>
    </form>
  );
}
