// context/CartContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

export type CartItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  unit: string;
  image: string;
  discount?: number;
};

type CartContextType = {
  items: CartItem[];

  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;

  getItemCount: () => number;
  getCartTotal: () => number;

  isInCart: (productId: string, size: string) => boolean;

  // ✅ NEW for Categories +/- buttons
  getItemQuantity: (productId: string, size: string) => number;
  increaseItem: (productId: string, size: string) => void;
  decreaseItem: (productId: string, size: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (newItem: Omit<CartItem, "id">) => {
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(
        (item) => item.productId === newItem.productId && item.size === newItem.size
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += newItem.quantity;
        return updatedItems;
      } else {
        const id = `${newItem.productId}-${newItem.size}-${Date.now()}`;
        return [...currentItems, { ...newItem, id }];
      }
    });
  };

  const removeItem = (id: string) => {
    setItems((currentItems) => currentItems.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(id);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const getItemCount = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const isInCart = (productId: string, size: string) => {
    return items.some((item) => item.productId === productId && item.size === size);
  };

  // ✅ NEW HELPERS
  const getItemQuantity = (productId: string, size: string) => {
    const found = items.find((i) => i.productId === productId && i.size === size);
    return found ? found.quantity : 0;
  };

  const increaseItem = (productId: string, size: string) => {
    setItems((currentItems) =>
      currentItems.map((i) =>
        i.productId === productId && i.size === size
          ? { ...i, quantity: i.quantity + 1 }
          : i
      )
    );
  };

  const decreaseItem = (productId: string, size: string) => {
    setItems((currentItems) => {
      const item = currentItems.find((i) => i.productId === productId && i.size === size);
      if (!item) return currentItems;

      if (item.quantity <= 1) {
        return currentItems.filter((i) => !(i.productId === productId && i.size === size));
      }

      return currentItems.map((i) =>
        i.productId === productId && i.size === size
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemCount,
        getCartTotal,
        isInCart,

        // new
        getItemQuantity,
        increaseItem,
        decreaseItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
