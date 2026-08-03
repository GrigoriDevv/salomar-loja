/* oxlint-disable react/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import type { Product } from "../data/catalog";
import type { CartLineView } from "../types/CartLineTypes";

interface CartState {
  items: CartLineView[];
  isOpen: boolean;
}

type CartAction =
  | { type: "add"; item: CartLineView }
  | { type: "remove"; productVariantId: string }
  | { type: "quantity"; productVariantId: string; quantity: number }
  | { type: "open"; value: boolean }
  | { type: "replace"; items: CartLineView[] };

const STORAGE_KEY = "salomar-cart";
const STORAGE_VERSION = 2;

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "open") return { ...state, isOpen: action.value };

  if (action.type === "replace") {
    return { ...state, items: action.items };
  }

  if (action.type === "add") {
    const existing = state.items.find(
      (item) => item.productVariantId === action.item.productVariantId,
    );
    const items = existing
      ? state.items.map((item) =>
          item.productVariantId === action.item.productVariantId
            ? { ...item, quantity: item.quantity + action.item.quantity }
            : item,
        )
      : [...state.items, action.item];
    return { items, isOpen: true };
  }

  if (action.type === "remove") {
    return {
      ...state,
      items: state.items.filter(
        (item) => item.productVariantId !== action.productVariantId,
      ),
    };
  }

  return {
    ...state,
    items: state.items
      .map((item) =>
        item.productVariantId === action.productVariantId
          ? { ...item, quantity: action.quantity }
          : item,
      )
      .filter((item) => item.quantity > 0),
  };
}

function buildView(product: Product, size: string): CartLineView | null {
  const variant = product.variants?.find((v) => v.size === size);
  if (!variant) return null;
  if (variant.stock < 1) return null;

  return {
    productVariantId: variant.id,
    quantity: 1,
    productId: product.id,
    name: product.name,
    size: variant.size,
    color: variant.color,
    unitPrice: product.price,
    image: product.image,
    focus: product.focus,
    stock: variant.stock,
  };
}

function loadCart(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [], isOpen: false };
    const parsed = JSON.parse(raw) as
      | { v?: number; items?: CartLineView[] }
      | CartLineView[];

    // v2: { v: 2, items: CartLineView[] }
    if (
      parsed &&
      !Array.isArray(parsed) &&
      parsed.v === STORAGE_VERSION &&
      Array.isArray(parsed.items)
    ) {
      return { items: parsed.items, isOpen: false };
    }

    // legado (product + size): descarta — sem variantId não dá para migrar offline
    return { items: [], isOpen: false };
  } catch {
    return { items: [], isOpen: false };
  }
}

interface CartContextValue extends CartState {
  count: number;
  subtotal: number;
  addItem: (product: Product, size: string) => boolean;
  removeItem: (productVariantId: string) => void;
  setQuantity: (productVariantId: string, quantity: number) => void;
  setOpen: (value: boolean) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ v: STORAGE_VERSION, items: state.items }),
    );
  }, [state.items]);

  const value = useMemo(
    () => ({
      ...state,
      count: state.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: state.items.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
      ),
      addItem: (product: Product, size: string) => {
        const view = buildView(product, size);
        if (!view) return false;
        dispatch({ type: "add", item: view });
        return true;
      },
      removeItem: (productVariantId: string) =>
        dispatch({ type: "remove", productVariantId }),
      setQuantity: (productVariantId: string, quantity: number) =>
        dispatch({ type: "quantity", productVariantId, quantity }),
      setOpen: (open: boolean) => dispatch({ type: "open", value: open }),
    }),
    [state],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
