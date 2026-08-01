/* oxlint-disable react/only-export-components -- provider, hook and reducer form one state module */
import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import type { Product } from '../data/catalog'

export interface CartItem {
  product: Product
  size: string
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
}

type CartAction =
  | { type: 'add'; product: Product; size: string }
  | { type: 'remove'; productId: string; size: string }
  | { type: 'quantity'; productId: string; size: string; quantity: number }
  | { type: 'open'; value: boolean }

const STORAGE_KEY = 'salomar-cart'

export function cartReducer(state: CartState, action: CartAction): CartState {
  if (action.type === 'open') return { ...state, isOpen: action.value }

  if (action.type === 'add') {
    const existing = state.items.find(
      (item) => item.product.id === action.product.id && item.size === action.size,
    )
    const items = existing
      ? state.items.map((item) =>
          item === existing ? { ...item, quantity: item.quantity + 1 } : item,
        )
      : [...state.items, { product: action.product, size: action.size, quantity: 1 }]
    return { items, isOpen: true }
  }

  if (action.type === 'remove') {
    return {
      ...state,
      items: state.items.filter(
        (item) => item.product.id !== action.productId || item.size !== action.size,
      ),
    }
  }

  return {
    ...state,
    items: state.items
      .map((item) =>
        item.product.id === action.productId && item.size === action.size
          ? { ...item, quantity: action.quantity }
          : item,
      )
      .filter((item) => item.quantity > 0),
  }
}

function loadCart(): CartState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? { items: JSON.parse(stored) as CartItem[], isOpen: false } : { items: [], isOpen: false }
  } catch {
    return { items: [], isOpen: false }
  }
}

interface CartContextValue extends CartState {
  count: number
  subtotal: number
  addItem: (product: Product, size: string) => void
  removeItem: (productId: string, size: string) => void
  setQuantity: (productId: string, size: string, quantity: number) => void
  setOpen: (value: boolean) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, loadCart)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
  }, [state.items])

  const value = useMemo(
    () => ({
      ...state,
      count: state.items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: state.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      addItem: (product: Product, size: string) => dispatch({ type: 'add', product, size }),
      removeItem: (productId: string, size: string) => dispatch({ type: 'remove', productId, size }),
      setQuantity: (productId: string, size: string, quantity: number) =>
        dispatch({ type: 'quantity', productId, size, quantity }),
      setOpen: (open: boolean) => dispatch({ type: 'open', value: open }),
    }),
    [state],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
