import { API_BASE_URL } from "../config/api";

/**
 * Convierte una ruta de imagen relativa a una URL completa
 * @param imagePath - Ruta de la imagen (relativa o absoluta)
 * @returns URL completa de la imagen
 */
export const getFullImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;

  // Si ya es una URL completa, devolverla tal como está
  if (imagePath.startsWith("http")) return imagePath;

  // Normalizar la ruta
  const normalizedPath = imagePath.startsWith("/")
    ? imagePath
    : "/" + imagePath;

  // En desarrollo: usar la URL completa del servidor
  if (API_BASE_URL.startsWith("http")) {
    const baseUrl = API_BASE_URL.replace("/api/v1", "");
    return `${baseUrl}${normalizedPath}`;
  }

  // En producción: las rutas relativas funcionan directamente
  // porque el frontend y backend están en el mismo dominio
  return normalizedPath;
};

/**
 * Obtiene una URL de imagen por defecto para productos
 * @returns URL de imagen por defecto
 */
export const getDefaultProductImageUrl = (): string => {
  const defaultPath = "/uploads/products/default-product.png";

  // En desarrollo: usar la URL completa del servidor
  if (API_BASE_URL.startsWith("http")) {
    const baseUrl = API_BASE_URL.replace("/api/v1", "");
    return `${baseUrl}${defaultPath}`;
  }

  // En producción: usar ruta relativa
  return defaultPath;
};
