// Utilidades para WhatsApp
interface UserData {
  id: string;
  name: string;
  lastname: string;
  email: string;
  whatsapp?: string;
  age?: number;
  isAdmin: boolean;
}

interface Product {
  _id?: string;
  id?: number;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  image: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

// Números de WhatsApp del negocio
export const WHATSAPP_PEDIDO = "5493584192268"; // Para pedidos
export const WHATSAPP_CONSULTA = "5493584020634"; // Para consultas generales

/**
 * Obtiene los datos del usuario logueado desde localStorage
 */
export const getLoggedUser = (): UserData | null => {
  try {
    const userData = localStorage.getItem("userData");
    if (userData) {
      return JSON.parse(userData);
    }
    return null;
  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    return null;
  }
};

/**
 * Formatea el precio en pesos argentinos
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Genera el mensaje para consultar sobre un producto específico
 */
export const generateProductConsultMessage = (
  product: Product,
  user: UserData | null,
): string => {
  const productPrice = formatPrice(product.price);

  let message = `¡Hola! Me interesa consultar sobre este producto:\n\n`;
  message += `📦 *${product.name}*\n`;
  message += `💰 Precio: ${productPrice}\n`;
  message += `📝 ${product.description}\n\n`;

  if (user) {
    message += `*Mis datos:*\n`;
    message += `👤 Nombre: ${user.name} ${user.lastname}\n`;
    message += `📧 Email: ${user.email}\n`;
    if (user.whatsapp) {
      message += `📱 WhatsApp: ${user.whatsapp}\n`;
    }
    message += `\n`;
  }

  message += `¿Podrían brindarme más información sobre este producto?`;

  return message;
};

/**
 * Genera el mensaje para realizar un pedido con el carrito completo
 */
export const generateOrderMessage = (
  cartItems: CartItem[],
  user: UserData | null,
): string => {
  const totalPrice = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  let message = `¡Hola! Quiero realizar un pedido:\n\n`;
  message += `🛒 *DETALLE DEL PEDIDO:*\n`;
  message += `${"=".repeat(30)}\n`;

  cartItems.forEach((item, index) => {
    const itemTotal = item.product.price * item.quantity;
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio unitario: ${formatPrice(item.product.price)}\n`;
    message += `   Subtotal: ${formatPrice(itemTotal)}\n\n`;
  });

  message += `${"=".repeat(30)}\n`;
  message += `💰 *TOTAL: ${formatPrice(totalPrice)}*\n\n`;

  if (user) {
    message += `*DATOS DEL CLIENTE:*\n`;
    message += `👤 Nombre completo: ${user.name} ${user.lastname}\n`;
    message += `📧 Email: ${user.email}\n`;
    if (user.whatsapp) {
      message += `📱 WhatsApp: ${user.whatsapp}\n`;
    }
    if (user.age) {
      message += `🎂 Edad: ${user.age} años\n`;
    }
    message += `\n`;
  }

  message += `¿Podrían confirmar la disponibilidad y coordinar la entrega?`;

  return message;
};

/**
 * Abre WhatsApp con un mensaje predefinido para pedidos
 */
export const openWhatsAppPedido = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_PEDIDO}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
};

/**
 * Abre WhatsApp con un mensaje predefinido para consultas generales
 */
export const openWhatsAppConsulta = (message: string): void => {
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_CONSULTA}?text=${encodedMessage}`;
  window.open(whatsappUrl, "_blank");
};

/**
 * Abre WhatsApp con un mensaje predefinido (mantener compatibilidad - usa número de pedidos)
 */
export const openWhatsApp = (message: string): void => {
  openWhatsAppPedido(message);
};

/**
 * Maneja la consulta de un producto específico (usa número de consultas)
 */
export const handleProductConsult = (product: Product): void => {
  const user = getLoggedUser();
  const message = generateProductConsultMessage(product, user);
  openWhatsAppConsulta(message);
};

/**
 * Maneja consultas generales del negocio
 */
export const handleGeneralConsult = (message: string = ""): void => {
  const user = getLoggedUser();
  let consultMessage = "¡Hola! Tengo una consulta sobre Arcoiris Joyería.\n\n";

  if (user) {
    consultMessage += `👤 ${user.name} ${user.lastname}\n`;
    consultMessage += `📧 ${user.email}\n`;
    if (user.whatsapp) {
      consultMessage += `📱 ${user.whatsapp}\n`;
    }
    consultMessage += `\n`;
  }

  if (message) {
    consultMessage += message;
  } else {
    consultMessage += "Me gustaría hacer una consulta.";
  }

  openWhatsAppConsulta(consultMessage);
};

/**
 * Maneja el pedido completo del carrito (usa número de pedidos)
 */
export const handleCartOrder = (cartItems: CartItem[]): void => {
  if (cartItems.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  const user = getLoggedUser();
  const message = generateOrderMessage(cartItems, user);
  openWhatsAppPedido(message);
};
