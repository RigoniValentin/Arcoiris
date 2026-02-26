import jsPDF from "jspdf";
import { Product } from "../types/shop";
import { getServerImageUrl } from "../config/api";

const COMPANY_NAME = "Arcoiris Joyería";

/**
 * Convierte una URL de imagen a base64 para incrustar en el PDF
 */
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const maxSize = 80;
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; }
      } else {
        if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      } else {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = url;
  });
};

/**
 * Formatea precio en pesos argentinos
 */
const formatPrice = (price: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(price);
};

/**
 * Exporta el catálogo de productos como PDF
 */
export const exportCatalogPDF = async (
  products: Product[],
  categoryName?: string
): Promise<void> => {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const now = new Date();
  const dateStr = now.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  // ============ HEADER ============
  // Fondo del header
  doc.setFillColor(14, 78, 78); // #0E4E4E
  doc.rect(0, 0, pageWidth, 35, "F");

  // Línea dorada decorativa
  doc.setFillColor(202, 161, 53); // #CAA135
  doc.rect(0, 35, pageWidth, 2, "F");

  // Nombre de la empresa
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(COMPANY_NAME, pageWidth / 2, 16, { align: "center" });

  // Subtítulo
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Catálogo de Productos", pageWidth / 2, 24, { align: "center" });

  // Fecha
  doc.setFontSize(8);
  doc.text(`${dateStr} - ${timeStr}`, pageWidth / 2, 30, { align: "center" });

  // ============ INFO SECTION ============
  let yPos = 45;

  if (categoryName) {
    doc.setTextColor(14, 78, 78);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Categoría: ${categoryName}`, 14, yPos);
    yPos += 6;
  }

  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Total de productos: ${products.length}`, 14, yPos);
  yPos += 8;

  // ============ PRODUCTOS CON FOTOS ============
  // Recolectar imágenes en paralelo
  const productSlice = products.slice(0, 200);
  const imagePromises = productSlice.map((p) => {
    const imgUrl = getServerImageUrl(p.image);
    return imgUrl ? imageToBase64(imgUrl) : Promise.resolve("");
  });

  const images = await Promise.all(imagePromises);

  // Catálogo visual: NOMBRE, FOTO, PRECIO
  const margin = 14;
  const colWidth = (pageWidth - margin * 2) / 3;
  const cardHeight = 70;
  const imageSize = 40;
  let col = 0;

  productSlice.forEach((product, index) => {
    // Calcular posición
    const x = margin + col * colWidth;

    // Si necesitamos nueva página
    if (yPos + cardHeight > doc.internal.pageSize.getHeight() - 25) {
      doc.addPage();
      yPos = 20;

      // Header de continuación
      doc.setFillColor(14, 78, 78);
      doc.rect(0, 0, pageWidth, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(`${COMPANY_NAME} — Catálogo`, pageWidth / 2, 8, { align: "center" });
      yPos = 20;
    }

    // Imagen del producto
    if (images[index]) {
      try {
        doc.addImage(images[index], "JPEG", x + (colWidth - imageSize) / 2, yPos, imageSize, imageSize);
      } catch {
        // Placeholder si la imagen falla
        doc.setFillColor(240, 240, 240);
        doc.rect(x + (colWidth - imageSize) / 2, yPos, imageSize, imageSize, "F");
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(7);
        doc.text("Sin imagen", x + colWidth / 2, yPos + imageSize / 2, { align: "center" });
      }
    } else {
      doc.setFillColor(245, 243, 239);
      doc.rect(x + (colWidth - imageSize) / 2, yPos, imageSize, imageSize, "F");
      doc.setTextColor(180, 180, 180);
      doc.setFontSize(7);
      doc.text("Sin imagen", x + colWidth / 2, yPos + imageSize / 2, { align: "center" });
    }

    // Nombre del producto
    doc.setTextColor(26, 26, 26);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    const productName = product.name.length > 22 ? product.name.substring(0, 22) + "..." : product.name;
    doc.text(productName, x + colWidth / 2, yPos + imageSize + 6, { align: "center" });

    // Precio
    doc.setTextColor(202, 161, 53);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(formatPrice(product.price), x + colWidth / 2, yPos + imageSize + 12, { align: "center" });

    // Siguiente columna
    col++;
    if (col >= 3) {
      col = 0;
      yPos += cardHeight;
    }
  });

  // Footer en última página
  const addFooter = (pageNum: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFillColor(202, 161, 53);
    doc.rect(0, pageHeight - 15, pageWidth, 1, "F");
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(
      `${COMPANY_NAME} | Catálogo generado el ${dateStr}`,
      14,
      pageHeight - 8
    );
    doc.text(
      `Página ${pageNum}`,
      pageWidth - 14,
      pageHeight - 8,
      { align: "right" }
    );
  };

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // ============ GUARDAR ============
  const fileName = `${COMPANY_NAME.replace(/\s+/g, "_")}_Catalogo_${dateStr.replace(/\//g, "-")}.pdf`;
  doc.save(fileName);
};
