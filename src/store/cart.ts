import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

interface CartState {
  lines: CartLine[];
  add: (line: CartLine, qty?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  clear: () => void;
  totalCount: () => number;
  totalPrice: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      add: (line, qty = 1) => {
        set((state) => {
          const existing = state.lines.find((l) => l.productId === line.productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === line.productId ? { ...l, quantity: l.quantity + qty } : l
              ),
            };
          }
          return { lines: [...state.lines, { ...line, quantity: qty }] };
        });
      },
      remove: (productId) => set((state) => ({ lines: state.lines.filter((l) => l.productId !== productId) })),
      setQuantity: (productId, qty) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.productId === productId ? { ...l, quantity: Math.max(1, qty) } : l))
            .filter((l) => l.quantity > 0),
        })),
      clear: () => set({ lines: [] }),
      totalCount: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      totalPrice: () => get().lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
    }),
    { name: "shonjibon.cart" }
  )
);
