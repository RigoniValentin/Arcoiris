import {
  Category,
  CreateCategoryData,
  CategoryFilters,
  ApiResponse,
  PaginatedResponse,
} from "../types/shop";
import { apiClient } from "./apiClient";

export class CategoryService {
  /**
   * Obtener todas las categorías con filtros y paginación
   */
  static async getCategories(
    filters: CategoryFilters = {},
  ): Promise<PaginatedResponse<Category>> {
    const params = Object.fromEntries(
      Object.entries(filters).filter(([_, value]) => value !== undefined),
    );

    // Intentar obtener TODAS las categorías sin filtros
    const allCategoriesParams = {
      limit: 100, // Asegurar que obtenemos todas
      view: "hierarchical", // Probar vista jerárquica si existe
    };

    try {
      const response = await apiClient.get<Category[]>(
        "/categories",
        allCategoriesParams,
      );

      return response as PaginatedResponse<Category>;
    } catch (error) {
      return apiClient.get<Category[]>("/categories", params) as Promise<
        PaginatedResponse<Category>
      >;
    }
  }

  /**
   * Obtener una categoría por ID
   */
  static async getCategory(
    id: string,
    includeProducts = false,
  ): Promise<ApiResponse<Category>> {
    const params = includeProducts ? { includeProducts: "true" } : {};
    return apiClient.get<Category>(`/categories/${id}`, params);
  }

  /**
   * Crear nueva categoría (requiere autenticación de admin)
   */
  static async createCategory(
    data: CreateCategoryData,
    authToken: string,
  ): Promise<ApiResponse<Category>> {
    apiClient.setAuthToken(authToken);
    try {
      return await apiClient.post<Category>("/categories", data);
    } finally {
      apiClient.clearAuthToken();
    }
  }

  /**
   * Actualizar categoría (requiere autenticación de admin)
   */
  static async updateCategory(
    id: string,
    data: Partial<CreateCategoryData>,
    authToken: string,
  ): Promise<ApiResponse<Category>> {
    apiClient.setAuthToken(authToken);
    try {
      return await apiClient.put<Category>(`/categories/${id}`, data);
    } finally {
      apiClient.clearAuthToken();
    }
  }

  /**
   * Eliminar categoría (requiere autenticación de admin)
   */
  static async deleteCategory(
    id: string,
    deleteProducts: boolean = false,
    authToken: string,
  ): Promise<
    ApiResponse<{ deletedCategory: any; deletedProductsCount: number }>
  > {
    apiClient.setAuthToken(authToken);
    try {
      const params = deleteProducts ? { deleteProducts: "true" } : {};
      return await apiClient.delete(`/categories/${id}`, params);
    } finally {
      apiClient.clearAuthToken();
    }
  }

  /**
   * Actualizar contadores de productos en todas las categorías
   */
  static async updateProductCounts(
    authToken: string,
  ): Promise<ApiResponse<any>> {
    apiClient.setAuthToken(authToken);
    try {
      return await apiClient.put("/categories/update-counts", {});
    } finally {
      apiClient.clearAuthToken();
    }
  }

  /**
   * Obtener el conteo de productos por categoría en una sola llamada
   * Espera que el backend exponga GET /categories/product-counts
   * Respuesta esperada: { success: true, data: { counts: Record<string, number>, updatedAt?: string } }
   */
  static async getProductCounts(params?: {
    includeParents?: boolean;
    includeLeaves?: boolean;
    rollupParents?: boolean; // si true, el backend devuelve conteo acumulado de los hijos para padres
  }): Promise<
    ApiResponse<{ counts: Record<string, number>; updatedAt?: string }>
  > {
    const query: Record<string, any> = {};
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) query[k] = String(v);
      });
    }
    return apiClient.get<{
      counts: Record<string, number>;
      updatedAt?: string;
    }>("/categories/product-counts", query);
  }

  /**
   * Método auxiliar para convertir categoría de API a formato UI
   */
  static apiToUiCategory(apiCategory: Category): Category {
    return {
      ...apiCategory,
      id: apiCategory.id || apiCategory._id, // Usar el ID de la API directamente
    };
  }

  /**
   * Método auxiliar para convertir categorías de API a formato UI
   */
  static apiToUiCategories(apiCategories: Category[]): Category[] {
    return apiCategories.map(this.apiToUiCategory);
  }
}
