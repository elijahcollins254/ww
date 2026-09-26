import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { Service } from '@/lib/api';

export type CartLine = {
  service: Service;
  quantity: number;
};

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  subtotal: number;
  addItem: (service: Service) => void;
  setQuantity: (serviceId: number, quantity: number) => void;
  removeItem: (serviceId: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    itemCount: items.reduce((count, item) => count + item.quantity, 0),
    subtotal: items.reduce((total, item) => total + Number(item.service.price) * item.quantity, 0),
    addItem: (service) => setItems((current) => {
      const existing = current.find((item) => item.service.id === service.id);
      if (existing) {
        return current.map((item) => item.service.id === service.id
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { service, quantity: 1 }];
    }),
    setQuantity: (serviceId, quantity) => setItems((current) => quantity < 1
      ? current.filter((item) => item.service.id !== serviceId)
      : current.map((item) => item.service.id === serviceId ? { ...item, quantity } : item)),
    removeItem: (serviceId) => setItems((current) => current.filter((item) => item.service.id !== serviceId)),
    clearCart: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider.');
  return context;
}