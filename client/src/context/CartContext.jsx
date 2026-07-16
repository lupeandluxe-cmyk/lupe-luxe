import { createContext, useContext, useReducer } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exist = state.items.find((i) => i.product === action.payload.product);
      if (exist) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.product === action.payload.product ? action.payload : i
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.product !== action.payload) };
    case 'APPLY_COUPON':
      return { ...state, coupon: action.payload };
    case 'REMOVE_COUPON':
      return { ...state, coupon: null };
    case 'CLEAR':
      return { ...state, items: [], coupon: null };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const saved = localStorage.getItem('ll_cart');
  const savedCoupon = localStorage.getItem('ll_coupon');
  const [state, dispatch] = useReducer(
    cartReducer,
    saved
      ? { items: JSON.parse(saved), coupon: savedCoupon ? JSON.parse(savedCoupon) : null }
      : { items: [], coupon: null }
  );

  const saveCart = (items) => localStorage.setItem('ll_cart', JSON.stringify(items));
  const saveCoupon = (c) => {
    if (c) localStorage.setItem('ll_coupon', JSON.stringify(c));
    else localStorage.removeItem('ll_coupon');
  };

  const addItem = (product, qty = 1, size = '') => {
    const item = {
      product: product._id,
      name: product.name,
      image: product.images?.[0] || '',
      price: product.price,
      countInStock: product.countInStock,
      qty,
      size,
    };
    dispatch({ type: 'ADD_ITEM', payload: item });
    const updated = state.items.some((i) => i.product === product._id)
      ? state.items.map((i) => (i.product === product._id ? item : i))
      : [...state.items, item];
    saveCart(updated);
  };

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id });
    saveCart(state.items.filter((i) => i.product !== id));
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    localStorage.removeItem('ll_cart');
    localStorage.removeItem('ll_coupon');
  };

  const applyCoupon = (coupon) => {
    dispatch({ type: 'APPLY_COUPON', payload: coupon });
    saveCoupon(coupon);
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
    saveCoupon(null);
  };

  const itemsPrice = state.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const discount = state.coupon ? state.coupon.discount : 0;
  const totalPrice = Math.max(0, itemsPrice - discount);

  return (
    <CartContext.Provider
      value={{
        items: state.items, addItem, removeItem, clearCart,
        itemsPrice, discount, discountCode: state.coupon?.code || null,
        totalPrice, applyCoupon, removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
