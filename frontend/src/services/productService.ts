import {
  Product,
  CreateProductData,
  UpdateStockData,
  ProductFilters,
  ApiResponse,
  PaginatedResponse,
} from "../types/shop";
import { apiClient } from "./apiClient";
import { API_BASE_URL } from "../config/api";

export interface UpdateProductData extends Partial<CreateProductData> {}

class ProductService {
  /**
   * Normalizar término de búsqueda para mejorar los resultados
   */
  private normalizeSearchTerm(searchTerm: string): string {
    if (!searchTerm) return searchTerm;

    const normalized = searchTerm
      .trim() // Eliminar espacios al inicio y final
      .replace(/\s+/g, " ") // Reemplazar múltiples espacios por uno solo
      .replace(/\s+([+\-*&|])\s*/g, " $1 ") // Normalizar espacios alrededor de operadores
      .replace(/\s+([+\-*&|])\s*$/, " $1") // Manejar operadores al final
      .toLowerCase(); // Convertir a minúsculas para búsqueda case-insensitive

    return normalized;
  }

  /**
   * Subir imágenes de productos
   */
  async uploadProductImages(
    files: File[],
    authToken?: string,
  ): Promise<string[]> {
    try {
      console.log("📸 Uploading product images:", files);

      // Configurar token de autenticación si se proporciona
      if (authToken) {
        apiClient.setAuthToken(authToken);
      }

      // Validaciones del frontend
      if (files.length > 6) {
        throw new Error("Máximo 6 imágenes permitidas");
      }

      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          // 5MB
          throw new Error(
            `La imagen ${file.name} excede el tamaño máximo de 5MB`,
          );
        }

        const allowedTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `Formato de imagen no permitido para ${file.name}. Use: jpeg, jpg, png, webp, gif`,
          );
        }
      }

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("images", file);
      });

      const response = await apiClient.postFormData<{ imageUrls: string[] }>(
        "/upload/products",
        formData,
      );

      if (response.success && response.data) {
        console.log(
          "✅ Images uploaded successfully:",
          response.data.imageUrls,
        );
        return response.data.imageUrls;
      } else {
        throw new Error(response.message || "Error al subir las imágenes");
      }
    } catch (error) {
      console.error("💥 Error uploading images:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al subir las imágenes",
      );
    }
  }

  /**
   * Obtener TODOS los productos sin límites para contar el total real
   */
  async getAllProductsCount(
    filters?: Omit<ProductFilters, "page" | "limit">,
  ): Promise<number> {
    try {
      const params: Record<string, any> = {};

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (
            value !== undefined &&
            value !== null &&
            key !== "page" &&
            key !== "limit"
          ) {
            // Normalizar término de búsqueda
            if (key === "search" && typeof value === "string") {
              const normalizedSearch = this.normalizeSearchTerm(value);
              if (normalizedSearch) {
                params[key] = normalizedSearch;
              }
            } else if (Array.isArray(value)) {
              params[key] = value.join(",");
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      // Usar un límite de 1 para obtener solo el total de paginación, no todos los productos
      params.limit = 1;

      const response = (await apiClient.get<Product[]>(
        "/products",
        params,
      )) as PaginatedResponse<Product>;

      if (response.success && response.data) {
        // Si la respuesta incluye paginación, usar el total de la paginación
        if (response.pagination && response.pagination.total) {
          return response.pagination.total;
        }

        // Fallback: contar los productos recibidos
        const products = this.apiToUiProducts(response.data);
        return products.length;
      } else {
        console.error(
          "❌ No se pudieron obtener los productos para contar:",
          response,
        );
        return 0;
      }
    } catch (error) {
      console.error("❌ Error fetching products count:", error);
      return 0;
    }
  }

  /**
   * Obtener todos los productos con filtros y paginación para la UI principal
   */
  async getAllProductsWithPagination(
    filters?: ProductFilters,
  ): Promise<
    Product[] | { data: Product[]; pagination: any; success: boolean }
  > {
    try {
      const params: Record<string, any> = {};

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Normalizar término de búsqueda
            if (key === "search" && typeof value === "string") {
              const normalizedSearch = this.normalizeSearchTerm(value);
              if (normalizedSearch) {
                params[key] = normalizedSearch;
              }
            } else if (Array.isArray(value)) {
              params[key] = value.join(",");
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      const response = (await apiClient.get<Product[]>(
        "/products",
        params,
      )) as PaginatedResponse<Product>;

      if (response.success && response.data) {
        // Si la respuesta tiene paginación, devolver la respuesta completa
        if (response.pagination) {
          return {
            data: this.apiToUiProducts(response.data),
            pagination: response.pagination,
            success: response.success,
          } as any;
        } else {
          // Si no hay paginación, devolver solo los productos
          return this.apiToUiProducts(response.data);
        }
      } else {
        console.error("❌ No se pudieron obtener los productos:", response);
        return [];
      }
    } catch (error) {
      console.error("❌ Error fetching products:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener productos",
      );
    }
  }

  /**
   * Obtener todos los productos con filtros y paginación
   */
  async getAllProducts(filters?: ProductFilters): Promise<Product[]> {
    try {
      const params: Record<string, any> = {};
      let useAdvancedSearch = false;

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            // Si hay búsqueda, usar el endpoint avanzado
            if (key === "search" && typeof value === "string") {
              const normalizedSearch = this.normalizeSearchTerm(value);
              if (normalizedSearch) {
                params["q"] = normalizedSearch; // El endpoint avanzado usa 'q'
                useAdvancedSearch = true;
              }
            } else if (Array.isArray(value)) {
              params[key] = value.join(",");
            } else {
              params[key] = value.toString();
            }
          }
        });
      }

      // Usar endpoint de búsqueda avanzada si hay término de búsqueda
      const endpoint = useAdvancedSearch ? "/products/search" : "/products";

      const response = (await apiClient.get<Product[]>(
        endpoint,
        params,
      )) as PaginatedResponse<Product>;

      if (response.success && response.data) {
        console.log("🔍 Search API raw response:", response);
        console.log("🔍 Search products received:", response.data);
        const products = this.apiToUiProducts(response.data);
        console.log("🔍 Search products converted:", products);
        return products;
      } else {
        console.error("❌ No se pudieron obtener los productos:", response);
        return [];
      }
    } catch (error) {
      console.error("� Error fetching products:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error desconocido al obtener productos",
      );
    }
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(id: string): Promise<Product> {
    try {
      console.log("🔍 Fetching product by ID:", id);

      const response = await apiClient.get<Product>(`/products/${id}`);

      if (response.success && response.data) {
        return this.apiToUiProduct(response.data);
      } else {
        throw new Error("Producto no encontrado");
      }
    } catch (error) {
      console.error("💥 Error fetching product:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al obtener el producto",
      );
    }
  }

  /**
   * Crear nuevo producto
   */
  async createProduct(
    productData: CreateProductData,
    files?: File[],
    authToken?: string,
  ): Promise<Product> {
    try {
      console.log("📝 Creating product:", productData);

      // Configurar token de autenticación si se proporciona
      if (authToken) {
        apiClient.setAuthToken(authToken);
      }

      let gallery = productData.gallery || [
        "/uploads/products/default-product.png",
      ];

      // Si hay archivos de imagen, subirlos primero
      if (files && files.length > 0) {
        console.log("📸 Uploading images first...");
        gallery = await this.uploadProductImages(files, authToken);
      }

      // Crear el payload JSON con las URLs de las imágenes
      const payload = {
        ...productData,
        gallery,
      };

      const response = await apiClient.post<Product>("/products", payload);

      if (response.success && response.data) {
        console.log("✅ Product created successfully:", response.data);
        return this.apiToUiProduct(response.data);
      } else {
        throw new Error(response.message || "Error al crear el producto");
      }
    } catch (error) {
      console.error("💥 Error creating product:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al crear el producto",
      );
    }
  }

  /**
   * Actualizar producto
   */
  async updateProduct(
    id: string,
    productData: UpdateProductData,
    files?: File[],
    authToken?: string,
  ): Promise<Product> {
    try {
      console.log("📝 Updating product:", id, productData);
      console.log("📝 Files to upload:", files);

      // Configurar token de autenticación si se proporciona
      if (authToken) {
        apiClient.setAuthToken(authToken);
      }

      let updateData = { ...productData };

      console.log("📝 Initial updateData:", updateData);

      // Si hay archivos de imagen nuevos, subirlos primero
      if (files && files.length > 0) {
        console.log("📸 Uploading new images for update...");
        const newGallery = await this.uploadProductImages(files, authToken);
        updateData.gallery = newGallery;
        console.log("📸 New gallery set:", newGallery);
      } else {
        console.log("📸 No new files to upload, preserving existing images");
      }
      // Si no se envían archivos, NO modificar la galería existente
      // (el backend mantendrá las imágenes actuales)

      console.log("📝 Final updateData before sending:", updateData);

      const response = await apiClient.put<Product>(
        `/products/${id}`,
        updateData,
      );

      if (response.success && response.data) {
        console.log("✅ Product updated successfully:", response.data);
        return this.apiToUiProduct(response.data);
      } else {
        throw new Error(response.message || "Error al actualizar el producto");
      }
    } catch (error) {
      console.error("💥 Error updating product:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al actualizar el producto",
      );
    }
  }

  /**
   * Actualizar solo el stock de un producto
   */
  async updateStock(
    id: string,
    stockData: UpdateStockData,
  ): Promise<ApiResponse<any>> {
    try {
      console.log("📦 Updating stock:", id, stockData);
      return await apiClient.put(`/products/${id}/stock`, stockData);
    } catch (error) {
      console.error("💥 Error updating stock:", error);
      throw new Error(
        error instanceof Error ? error.message : "Error al actualizar el stock",
      );
    }
  }

  /**
   * Eliminar producto
   */
  async deleteProduct(
    id: string,
    permanent: boolean = false,
    authToken?: string,
  ): Promise<void> {
    try {
      console.log("🗑️ Deleting product:", id);

      // Configurar token de autenticación si se proporciona
      if (authToken) {
        apiClient.setAuthToken(authToken);
      }

      const params = permanent ? { permanent: "true" } : {};
      const response = await apiClient.delete(`/products/${id}`, params);

      if (!response.success) {
        throw new Error(response.message || "Error al eliminar el producto");
      }

      console.log("✅ Product deleted successfully");
    } catch (error) {
      console.error("💥 Error deleting product:", error);
      throw new Error(
        error instanceof Error
          ? error.message
          : "Error al eliminar el producto",
      );
    }
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    return this.getAllProducts({ categoryId });
  }

  /**
   * Buscar productos usando el endpoint de búsqueda avanzada mejorado
   */
  async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const params = {
        q: searchTerm, // El nuevo endpoint espera 'q' en lugar de 'search'
      };

      const response = (await apiClient.get<Product[]>(
        "/products/search",
        params,
      )) as PaginatedResponse<Product>;

      if (response.success && response.data) {
        return this.apiToUiProducts(response.data);
      } else {
        console.error("❌ No se pudieron obtener los productos:", response);
        return [];
      }
    } catch (error) {
      console.error("❌ Error en búsqueda avanzada:", error);
      // Fallback al método regular si falla la búsqueda avanzada
      console.log("🔄 Fallback to regular search...");
      return this.getAllProducts({ search: searchTerm });
    }
  }

  /**
   * Obtener productos destacados
   */
  async getFeaturedProducts(): Promise<Product[]> {
    return this.getAllProducts({ featured: true });
  }

  /**
   * Método auxiliar para convertir producto de API a formato UI
   */
  private apiToUiProduct(apiProduct: any): Product {
    console.log("🔧 Converting API product:", apiProduct);

    // Si es un documento de Mongoose, extraer los datos de _doc
    const productData = apiProduct._doc || apiProduct;
    console.log("📦 Product data extracted:", productData);

    // Función para convertir rutas relativas a URLs completas
    const getFullImageUrl = (imagePath: string): string => {
      if (!imagePath)
        return `${API_BASE_URL.replace("/api/v1", "")}/uploads/products/default-product.png`;
      if (imagePath.startsWith("http")) return imagePath; // Ya es URL completa
      return `${API_BASE_URL.replace("/api/v1", "")}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
    };

    const convertedProduct = {
      ...productData,
      id: productData._id
        ? parseInt(productData._id.toString().slice(-8), 16)
        : undefined,
      categoryId: productData.categoryId, // Mantener el ObjectID original
      // Asegurar que image existe con URL completa
      image: getFullImageUrl(
        productData.image ||
          (productData.gallery && productData.gallery.length > 0
            ? productData.gallery[0]
            : "/uploads/products/default-product.png"),
      ),
      // Asegurar que gallery existe con URLs completas
      gallery:
        productData.gallery && productData.gallery.length > 0
          ? productData.gallery.map((img: string) => getFullImageUrl(img))
          : [
              getFullImageUrl(
                productData.image || "/uploads/products/default-product.png",
              ),
            ],
      // Mantener el score de relevancia si existe
      relevanceScore: apiProduct.relevanceScore,
    };

    console.log("✅ Converted product:", convertedProduct);
    return convertedProduct;
  } /**
   * Método auxiliar para convertir productos de API a formato UI
   */
  private apiToUiProducts(apiProducts: Product[]): Product[] {
    return apiProducts.map((product) => this.apiToUiProduct(product));
  }

  // ===== MÉTODOS DE COMPATIBILIDAD PARA LA UI EXISTENTE =====

  /**
   * Método de compatibilidad: obtener producto por ID numérico
   */
  async getProductById_Legacy(id: number): Promise<Product> {
    // En una implementación real, necesitarías mapear IDs numéricos a ObjectIds
    // Por ahora, convertimos el ID a string
    return this.getProductById(id.toString());
  }

  /**
   * Método de compatibilidad: crear producto sin imágenes
   */
  async createProduct_Legacy(productData: CreateProductData): Promise<Product> {
    return this.createProduct(productData);
  }

  /**
   * Método de compatibilidad: actualizar producto sin imágenes
   */
  async updateProduct_Legacy(
    id: number,
    productData: UpdateProductData,
  ): Promise<Product> {
    return this.updateProduct(id.toString(), productData);
  }

  /**
   * Método de compatibilidad: eliminar producto por ID numérico
   */
  async deleteProduct_Legacy(id: number): Promise<void> {
    return this.deleteProduct(id.toString());
  }

  /**
   * Método de compatibilidad: obtener productos por categoría numérica
   */
  async getProductsByCategory_Legacy(categoryId: number): Promise<Product[]> {
    return this.getProductsByCategory(categoryId.toString());
  }
}

export const productService = new ProductService();
