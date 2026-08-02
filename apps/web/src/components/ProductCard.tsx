import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router";
import { formatPrice, type Product } from "../data/catalog";

interface ProductCardProps {
  product: Product;
  index: number;
  onSelect?: (product: Product) => void;
}
export function ProductCard({ product, index }: ProductCardProps) {
  const variant = (index % 4) + 1;
  const navigate = useNavigate();

  function formatSizeRange(sizes: string[]): string {
    if (sizes.length === 0) return "";
    if (sizes.length === 1) return sizes[0];
    return `${sizes[0]}–${sizes[sizes.length - 1]}`;
  }

  return (
    <article className={`product-card product-card--${variant}`}>
      <button
        className="product-card__image"
        onClick={() => navigate(`/produto/${product.id}`)}
        aria-label={`Ver ${product.name}`}
      >
        <img
          src={product.image}
          alt={product.alt}
          loading={index > 1 ? "lazy" : "eager"}
          style={{ objectPosition: product.focus }}
        />
        <span>
          Ver peça <ArrowUpRight aria-hidden="true" />
        </span>
      </button>
      <div className="product-card__details">
        <div>
          <h3>{product.name}</h3>
          <p>{product.subtitle}</p>
          <p className="product-card__variation">
            {product.tone} · {formatSizeRange(product.sizes)}
          </p>
        </div>
        <p>{formatPrice(product.price)}</p>
      </div>
    </article>
  );
}
