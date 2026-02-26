/**
 * Utilidad de compresión de imágenes profesional
 * Comprime imágenes del lado del cliente antes de subirlas al servidor
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.85,
  mimeType: "image/jpeg",
};

/**
 * Comprime una imagen manteniendo la relación de aspecto
 */
export const compressImage = async (
  file: File,
  options: CompressionOptions = {},
): Promise<CompressionResult> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  return new Promise((resolve, reject) => {
    // Crear un elemento de imagen para cargar el archivo
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("No se pudo obtener el contexto del canvas"));
      return;
    }

    img.onload = () => {
      // Calcular dimensiones manteniendo la relación de aspecto
      let { width, height } = img;
      const maxWidth = opts.maxWidth || 1920;
      const maxHeight = opts.maxHeight || 1080;

      // Si la imagen es más grande que el máximo, redimensionar
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Configurar canvas con las nuevas dimensiones
      canvas.width = width;
      canvas.height = height;

      // Dibujar la imagen redimensionada
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Convertir a blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Error al comprimir la imagen"));
            return;
          }

          // Crear nuevo archivo con el blob comprimido
          const compressedFile = new File(
            [blob],
            file.name.replace(/\.[^/.]+$/, ".jpg"),
            {
              type: opts.mimeType || "image/jpeg",
              lastModified: Date.now(),
            },
          );

          const compressedSize = compressedFile.size;
          const compressionRatio =
            originalSize > 0
              ? Math.round((1 - compressedSize / originalSize) * 100)
              : 0;

          resolve({
            file: compressedFile,
            originalSize,
            compressedSize,
            compressionRatio,
            width,
            height,
          });
        },
        opts.mimeType || "image/jpeg",
        opts.quality || 0.85,
      );
    };

    img.onerror = () => {
      reject(new Error("Error al cargar la imagen"));
    };

    // Cargar la imagen desde el archivo
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Compresión específica para slides del Hero (alta calidad, tamaño optimizado para banner)
 */
export const compressHeroSlideImage = async (
  file: File,
): Promise<CompressionResult> => {
  return compressImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    mimeType: "image/jpeg",
  });
};

/**
 * Formatea el tamaño de archivo para mostrar
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Valida si un archivo es una imagen válida
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  return validTypes.includes(file.type);
};

/**
 * Obtiene la URL de preview de una imagen
 */
export const getImagePreviewUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = () => {
      reject(new Error("Error al leer el archivo"));
    };
    reader.readAsDataURL(file);
  });
};
