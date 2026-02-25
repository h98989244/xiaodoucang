import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  product_id: string;
  variant_id: string;
  product_name: string;
  variant_label: string;
  price: number;
  quantity: number;
  image: string;
}

interface CartContextType {
  items: CartItem[];
  count: number;
  total: number;
  loading: boolean;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CART_KEY = 'xiaodoucang_cart';
const CartContext = createContext<CartContextType | undefined>(undefined);

function getLocalCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function setLocalCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems(getLocalCart());
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', user.id);
    if (data) setItems(data as CartItem[]);
    setLoading(false);
  }, [user]);

  // Sync localStorage cart to DB on login
  useEffect(() => {
    if (!user) {
      setItems(getLocalCart());
      return;
    }
    const localItems = getLocalCart();
    if (localItems.length > 0) {
      (async () => {
        for (const item of localItems) {
          await supabase.from('cart_items').upsert({
            user_id: user.id,
            product_id: item.product_id,
            variant_id: item.variant_id,
            product_name: item.product_name,
            variant_label: item.variant_label,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          }, { onConflict: 'user_id,variant_id' });
        }
        localStorage.removeItem(CART_KEY);
        fetchCart();
      })();
    } else {
      fetchCart();
    }
  }, [user, fetchCart]);

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    if (!user) {
      const local = getLocalCart();
      const existing = local.find(i => i.variant_id === item.variant_id);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        local.push({ ...item, id: crypto.randomUUID() });
      }
      setLocalCart(local);
      setItems(local);
      return;
    }
    await supabase.from('cart_items').upsert({
      user_id: user.id,
      ...item,
    }, { onConflict: 'user_id,variant_id' });
    await fetchCart();
  };

  const removeItem = async (id: string) => {
    if (!user) {
      const local = getLocalCart().filter(i => i.id !== id);
      setLocalCart(local);
      setItems(local);
      return;
    }
    await supabase.from('cart_items').delete().eq('id', id);
    await fetchCart();
  };

  const updateQuantity = async (id: string, quantity: number) => {
    if (quantity < 1) return removeItem(id);
    if (!user) {
      const local = getLocalCart().map(i => i.id === id ? { ...i, quantity } : i);
      setLocalCart(local);
      setItems(local);
      return;
    }
    await supabase.from('cart_items').update({ quantity }).eq('id', id);
    await fetchCart();
  };

  const clearCart = async () => {
    if (!user) {
      localStorage.removeItem(CART_KEY);
      setItems([]);
      return;
    }
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  };

  return (
    <CartContext.Provider value={{ items, count, total, loading, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
