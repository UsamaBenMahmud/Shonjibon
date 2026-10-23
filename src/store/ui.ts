import { create } from "zustand";

interface Toast {
  id: string;
  message: string;
  variant: "success" | "error" | "info";
}

interface UIState {
  cartOpen: boolean;
  menuOpen: boolean;
  toasts: Toast[];
  setCartOpen: (open: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  pushToast: (message: string, variant?: Toast["variant"]) => void;
  dismissToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  cartOpen: false,
  menuOpen: false,
  toasts: [],
  setCartOpen: (open) => set({ cartOpen: open }),
  setMenuOpen: (open) => set({ menuOpen: open }),
  pushToast: (message, variant = "info") =>
    set((state) => ({
      toasts: [...state.toasts, { id: `${Date.now()}-${Math.random()}`, message, variant }],
    })),
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
