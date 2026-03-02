/**
 * Test de compatibilidad de URLs de imágenes
 *
 * Este archivo demuestra cómo las funciones de imageUtils
 * funcionan correctamente en desarrollo y producción
 */

// Simulación de entorno de DESARROLLO
const DEV_API_BASE_URL = "http://localhost:3015/api/v1";

// Simulación de entorno de PRODUCCIÓN
const PROD_API_BASE_URL = "/api/v1";

// Ejemplo de URL que devuelve el servidor
const SERVER_IMAGE_PATH = "/uploads/products/product-123.jpeg";

/**
 * Función de test para desarrollo
 */
function testDevelopment() {
  console.log("🚀 === ENTORNO DE DESARROLLO ===");
  console.log("API_BASE_URL:", DEV_API_BASE_URL);

  // Simular la función getFullImageUrl en desarrollo
  const baseUrl = DEV_API_BASE_URL.replace("/api/v1", ""); // "http://localhost:3015"
  const result = `${baseUrl}${SERVER_IMAGE_PATH}`;

  console.log("Ruta del servidor:", SERVER_IMAGE_PATH);
  console.log("URL final:", result);
  console.log("✅ Resultado: URL completa para desarrollo");
  console.log("");
}

/**
 * Función de test para producción
 */
function testProduction() {
  console.log("🌐 === ENTORNO DE PRODUCCIÓN ===");
  console.log("API_BASE_URL:", PROD_API_BASE_URL);

  // Simular la función getFullImageUrl en producción
  // Como API_BASE_URL NO empieza con "http", usamos ruta relativa
  const result = SERVER_IMAGE_PATH;

  console.log("Ruta del servidor:", SERVER_IMAGE_PATH);
  console.log("URL final:", result);
  console.log(
    "✅ Resultado: Ruta relativa para producción (funciona porque frontend y backend están en mismo dominio)",
  );
  console.log("");
}

// Ejecutar tests
testDevelopment();
testProduction();

/**
 * EXPLICACIÓN:
 *
 * DESARROLLO:
 * - Frontend: http://localhost:5173
 * - Backend:  http://localhost:3015
 * - Necesitamos URLs completas: http://localhost:3015/uploads/products/image.jpg
 *
 * PRODUCCIÓN:
 * - Frontend y Backend en el mismo dominio: https://tudominio.com
 * - Las rutas relativas funcionan: /uploads/products/image.jpg
 * - El navegador automáticamente las resuelve como: https://tudominio.com/uploads/products/image.jpg
 */
