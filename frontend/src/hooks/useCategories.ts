import { useState, useEffect, useCallback } from "react";
import { CategoryService } from "../services/categoryService";
import { Category, CategoryFilters, CreateCategoryData } from "../types/shop";

export const useCategories = (filters: CategoryFilters = {}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<any>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await CategoryService.getCategories(filters);

      if (response.success) {
        console.log("🔍 RAW API RESPONSE:", response.data);
        console.log("📊 Total categorías de la API:", response.data.length);

        // Análisis por level
        const levelAnalysis: Record<string, number> = {};
        response.data.forEach((cat) => {
          const level = cat.level?.toString() || "undefined";
          levelAnalysis[level] = (levelAnalysis[level] || 0) + 1;
        });
        console.log("📈 Distribución por level (RAW):", levelAnalysis);

        // Buscar CHUCHES específicamente
        const chuchesInRaw = response.data.find(
          (cat) =>
            cat.name?.toLowerCase().includes("chuches") ||
            cat._id === "68b47d8ce2a98ab7c43623f9",
        );
        console.log(
          "🍭 CHUCHES en respuesta RAW:",
          chuchesInRaw ? chuchesInRaw.name : "NO ENCONTRADO",
        );

        const uiCategories = CategoryService.apiToUiCategories(response.data);
        console.log("🔄 Después de transformación UI:", uiCategories.length);

        // Verificar CHUCHES después de transformación
        const chuchesInUI = uiCategories.find(
          (cat) =>
            cat.name?.toLowerCase().includes("chuches") ||
            cat._id === "68b47d8ce2a98ab7c43623f9",
        );
        console.log(
          "🍭 CHUCHES después de UI transform:",
          chuchesInUI ? chuchesInUI.name : "NO ENCONTRADO",
        );

        setCategories(uiCategories);
        setPagination(response.pagination);
      } else {
        throw new Error(response.message || "Error al cargar categorías");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("❌ Error loading categories:", errorMessage);
      setError(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const refetch = useCallback(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Función para crear categoría y refrescar la lista automáticamente
  const createCategoryAndRefresh = useCallback(
    async (
      data: CreateCategoryData,
      authToken: string,
    ): Promise<Category | null> => {
      try {
        setError(null);

        const response = await CategoryService.createCategory(data, authToken);

        if (response.success) {
          const uiCategory = CategoryService.apiToUiCategory(response.data);
          console.log("✅ Category created:", uiCategory);

          // Refrescar la lista de categorías
          await fetchCategories();

          return uiCategory;
        } else {
          throw new Error(response.message || "Error al crear categoría");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error creating category:", errorMessage);
        return null;
      }
    },
    [fetchCategories],
  );

  return {
    categories,
    loading,
    error,
    pagination,
    refetch,
    createCategoryAndRefresh,
  };
};

export const useCategory = (id: string | null) => {
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(
    async (categoryId: string, includeProducts = false) => {
      try {
        setLoading(true);
        setError(null);

        const response = await CategoryService.getCategory(
          categoryId,
          includeProducts,
        );

        if (response.success) {
          const uiCategory = CategoryService.apiToUiCategory(response.data);
          setCategory(uiCategory);
        } else {
          throw new Error(response.message || "Error al cargar categoría");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        setCategory(null);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (id) {
      fetchCategory(id);
    } else {
      setCategory(null);
      setLoading(false);
      setError(null);
    }
  }, [id, fetchCategory]);

  const refetch = useCallback(() => {
    if (id) {
      fetchCategory(id);
    }
  }, [id, fetchCategory]);

  return {
    category,
    loading,
    error,
    refetch,
    fetchCategory,
  };
};

export const useCategoryMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCategory = useCallback(
    async (
      data: CreateCategoryData,
      authToken: string,
    ): Promise<Category | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await CategoryService.createCategory(data, authToken);

        if (response.success) {
          const uiCategory = CategoryService.apiToUiCategory(response.data);
          console.log("✅ Category created:", uiCategory);
          return uiCategory;
        } else {
          throw new Error(response.message || "Error al crear categoría");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error creating category:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateCategory = useCallback(
    async (
      id: string,
      data: Partial<CreateCategoryData>,
      authToken: string,
    ): Promise<Category | null> => {
      try {
        setLoading(true);
        setError(null);

        const response = await CategoryService.updateCategory(
          id,
          data,
          authToken,
        );

        if (response.success) {
          const uiCategory = CategoryService.apiToUiCategory(response.data);
          console.log("✅ Category updated:", uiCategory);
          return uiCategory;
        } else {
          throw new Error(response.message || "Error al actualizar categoría");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error updating category:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteCategory = useCallback(
    async (
      id: string,
      deleteProducts: boolean,
      authToken: string,
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await CategoryService.deleteCategory(
          id,
          deleteProducts,
          authToken,
        );

        if (response.success) {
          console.log("✅ Category deleted:", response.data);
          return true;
        } else {
          throw new Error(response.message || "Error al eliminar categoría");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error deleting category:", errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    loading,
    error,
  };
};
