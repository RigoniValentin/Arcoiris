import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import { Product } from "../types/shop";

interface CartItem {
  productId: string;
  quantity: number;
  product: Product;
}

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar carrito desde localStorage al inicio
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("arcoiris-cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(parsedCart);
        console.log("🛒 Cart loaded from localStorage:", parsedCart);
      }
    } catch (err) {
      console.error("❌ Error loading cart from localStorage:", err);
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    try {
      localStorage.setItem("arcoiris-cart", JSON.stringify(cart));
      console.log("💾 Cart saved to localStorage:", cart);
    } catch (err) {
      console.error("❌ Error saving cart to localStorage:", err);
    }
  }, [cart]);

  const addToCart = useCallback(
    async (productId: string, quantity = 1) => {
      try {
        setLoading(true);
        setError(null);

        // Verificar si el producto ya está en el carrito
        const existingItemIndex = cart.findIndex(
          (item) => item.productId === productId,
        );

        if (existingItemIndex >= 0) {
          // Actualizar cantidad del producto existente
          setCart((prevCart) =>
            prevCart.map((item, index) =>
              index === existingItemIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            ),
          );
          console.log("📦 Updated quantity for existing product in cart");
        } else {
          // Obtener información del producto y agregarlo al carrito
          const product = await productService.getProductById(productId);

          const newItem: CartItem = {
            productId,
            quantity,
            product,
          };

          setCart((prevCart) => [...prevCart, newItem]);
          console.log("➕ Product added to cart:", newItem);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error al agregar al carrito";
        setError(errorMessage);
        console.error("❌ Error adding to cart:", errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [cart],
  );

  const removeFromCart = useCallback((productId: string) => {
    setCart((prevCart) => {
      const updatedCart = prevCart.filter(
        (item) => item.productId !== productId,
      );
      console.log("🗑️ Product removed from cart:", productId);
      return updatedCart;
    });
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }

      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item,
        ),
      );
      console.log(
        "🔄 Updated quantity for product:",
        productId,
        "to",
        quantity,
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
    console.log("🗑️ Cart cleared");
  }, []);

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const getTotalPrice = useCallback(() => {
    return cart.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0,
    );
  }, [cart]);

  const getSubtotal = useCallback(() => {
    return cart.reduce((total, item) => {
      const itemPrice = item.product.originalPrice || item.product.price;
      return total + itemPrice * item.quantity;
    }, 0);
  }, [cart]);

  const getTotalDiscount = useCallback(() => {
    return getSubtotal() - getTotalPrice();
  }, [getTotalPrice, getSubtotal]);

  const isInCart = useCallback(
    (productId: string) => {
      return cart.some((item) => item.productId === productId);
    },
    [cart],
  );

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = cart.find((item) => item.productId === productId);
      return item ? item.quantity : 0;
    },
    [cart],
  );

  // Verificar disponibilidad de stock
  const validateCartStock = useCallback(async () => {
    const validationResults = await Promise.all(
      cart.map(async (item) => {
        try {
          const product = await productService.getProductById(item.productId);
          return {
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableStock: product.stockCount,
            isValid: product.inStock && product.stockCount >= item.quantity,
            product: product,
          };
        } catch (err) {
          return {
            productId: item.productId,
            requestedQuantity: item.quantity,
            availableStock: 0,
            isValid: false,
            product: item.product,
            error: err instanceof Error ? err.message : "Error desconocido",
          };
        }
      }),
    );

    return validationResults;
  }, [cart]);

  return {
    cart,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getSubtotal,
    getTotalDiscount,
    isInCart,
    getItemQuantity,
    validateCartStock,
  };
};
