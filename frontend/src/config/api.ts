export const API_BASE_URL = "/api/v1";
//export const API_BASE_URL = "http://localhost:3015/api/v1";

// URL base del servidor (sin /api/v1) para archivos estáticos como uploads
// Se deriva automáticamente del API_BASE_URL
export const SERVER_BASE_URL = API_BASE_URL.replace("/api/v1", "");

/**
 * Construye la URL completa para una imagen del servidor
 * @param path - Ruta relativa de la imagen (ej: /uploads/slides/imagen.jpg)
 * @returns URL completa o la ruta original si ya es una URL completa
 */
export const getServerImageUrl = (path: string | undefined): string => {
  if (!path) return "";
  // Si ya es una URL completa (http/https) o data URL, devolverla tal cual
  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:")
  ) {
    return path;
  }
  // Si es una ruta relativa del servidor, agregar el SERVER_BASE_URL
  return `${SERVER_BASE_URL}${path}`;
};
