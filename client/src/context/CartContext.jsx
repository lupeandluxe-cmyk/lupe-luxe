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
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const saved = localStorage.getItem('ll_cart');
  const [state, dispatch] = useReducer(
    cartReducer,
    saved ? { items: JSON.parse(saved) } : { items: [] }
  );

  const saveCart = (items) => localStorage.setItem('ll_cart', JSON.stringify(items));

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
  };

  const itemsPrice = state.items.reduce((acc, i) => acc + i.price * i.qty, 0);
  const shippingPrice = itemsPrice > 3999 ? 0 : 199;
  const taxPrice = Number((0.12 * itemsPrice).toFixed(2));
  const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

  return (
    <CartContext.Provider
      value={{ items: state.items, addItem, removeItem, clearCart, itemsPrice, shippingPrice, taxPrice, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
};
