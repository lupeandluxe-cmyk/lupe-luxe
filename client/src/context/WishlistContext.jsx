import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const WishlistContext = createContext();
export const useWishlist = () => useContext(WishlistContext);

const STORAGE_KEY = 'll_wishlist';

function normalize(product) {
  if (!product || !product._id) return null;
  const hasSale = product.salePrice && product.salePrice < product.price;
  return {
    _id: product._id,
    name: product.name,
    images: Array.isArray(product.images) ? product.images.slice(0, 2) : [],
    price: product.price,
    salePrice: hasSale ? product.salePrice : null,
    category: product.category || '',
    rating: product.rating || 0,
    numReviews: product.numReviews || 0,
    countInStock: product.countInStock ?? 0,
    size: Array.isArray(product.size) ? product.size : [],
    bestSeller: Boolean(product.bestSeller),
    featured: Boolean(product.featured),
    createdAt: product.createdAt || null,
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => p && p._id) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }) {
  const [items, setItems] = useState(readStored);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const value = useMemo(() => {
    const isWishlisted = (id) => items.some((item) => item._id === id);
    const toggleWishlist = (product) => {
      const normalized = normalize(product);
      if (!normalized) return false;
      let active = false;
      setItems((prev) => {
        if (prev.some((item) => item._id === normalized._id)) {
          active = false;
          return prev.filter((item) => item._id !== normalized._id);
        }
        active = true;
        return [normalized, ...prev];
      });
      return active;
    };
    const removeWishlist = (id) => {
      setItems((prev) => prev.filter((item) => item._id !== id));
    };
    return { items, count: items.length, isWishlisted, toggleWishlist, removeWishlist };
  }, [items]);

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
