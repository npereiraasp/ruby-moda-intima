import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('ruby_cart') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('ruby_cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product, variant, quantity = 1) => {
    setItems(prev => {
      const key = `${product.id}-${variant?.id || 'default'}`;
      const existing = prev.find(i => i.key === key);
      if (existing) {
        toast.success('Quantidade atualizada!');
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i);
      }
      toast.success('Produto adicionado ao carrinho! 🛍️');
      return [...prev, {
        key,
        product_id: product.id,
        variant_id: variant?.id || null,
        product_name: product.name,
        primary_image: product.primary_image || product.images?.[0]?.url,
        price: product.promotional_price || product.price,
        color_name: variant?.color_name,
        color_hex: variant?.color_hex,
        size: variant?.size,
        quantity
      }];
    });
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(i => i.key !== key));
    toast.success('Item removido do carrinho');
  };

  const updateQuantity = (key, quantity) => {
    if (quantity <= 0) return removeItem(key);
    setItems(prev => prev.map(i => i.key === key ? { ...i, quantity } : i));
  };

  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const shipping = subtotal >= 200 ? 0 : 15.90;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      subtotal, total, shipping, totalItems
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
