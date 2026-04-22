'use client';

import { createContext, useContext, useEffect, useReducer, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'nv_cart_v1';

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload || [];
    case 'ADD': {
      const { item } = action;
      const key = `${item.productId}:${item.size || ''}`;
      const idx = state.findIndex((l) => `${l.productId}:${l.size || ''}` === key);
      if (idx >= 0) {
        const next = [...state];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...state, { ...item, quantity: item.quantity || 1 }];
    }
    case 'UPDATE_QTY': {
      return state.map((l, i) => (i === action.index ? { ...l, quantity: Math.max(1, action.quantity) } : l));
    }
    case 'REMOVE':
      return state.filter((_, i) => i !== action.index);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(reducer, []);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: 'HYDRATE', payload: JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = (item) => {
    dispatch({ type: 'ADD', item });
    setDrawerOpen(true);
  };
  const update = (index, quantity) => dispatch({ type: 'UPDATE_QTY', index, quantity });
  const remove = (index) => dispatch({ type: 'REMOVE', index });
  const clear = () => dispatch({ type: 'CLEAR' });

  const count = items.reduce((sum, it) => sum + it.quantity, 0);
  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, add, update, remove, clear, drawerOpen, setDrawerOpen }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
