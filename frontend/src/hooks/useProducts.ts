import { useState, useEffect, useCallback } from "react";
import { productService } from "../services/productService";
import {
  Product,
  ProductFilters,
  CreateProductData,
  UpdateStockData,
} from "../types/shop";

export const useProducts = (filters: ProductFilters = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Para todos los casos (con y sin filtros), usar paginación
      const currentPage = filters.page || 1;
      const limit = filters.limit || 12;

      // Si hay filtros de búsqueda, usar métodos específicos pero con paginación
      if (filters.search) {
        // Para búsqueda, usar getAllProducts directamente (sin paginación en búsqueda)
        const products = await productService.getAllProducts(filters);
        setProducts(products);
        const totalProducts = products.length;
        setPagination({
          page: 1,
          limit: totalProducts,
          total: totalProducts,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        });
      } else {
        // Para categorías y vista principal, usar paginación
        const [totalProducts, paginatedResponse] = await Promise.all([
          // Obtener el total considerando TODOS los filtros aplicados
          productService
            .getAllProductsWithPagination({
              categoryId: filters.categoryId,
              category: filters.category,
              featured: filters.featured,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
              sortBy: filters.sortBy,
              page: 1,
              limit: 1, // Solo necesitamos el total
            })
            .then((response) => {
              if (Array.isArray(response)) {
                return response.length;
              } else {
                return response.pagination?.total || 0;
              }
            }),
          productService.getAllProductsWithPagination({
            page: currentPage,
            limit: limit,
            categoryId: filters.categoryId,
            category: filters.category,
            minPrice: filters.minPrice,
            maxPrice: filters.maxPrice,
            sortBy: filters.sortBy,
            featured: filters.featured,
          }),
        ]);

        // Verificar el tipo de respuesta
        if (Array.isArray(paginatedResponse)) {
          // Respuesta directa de productos
          setProducts(paginatedResponse);
        } else {
          // Respuesta con paginación
          setProducts(paginatedResponse.data);
        }

        setPagination({
          page: currentPage,
          limit: limit,
          total: totalProducts,
          pages: Math.ceil(totalProducts / limit),
          hasNext: currentPage < Math.ceil(totalProducts / limit),
          hasPrev: currentPage > 1,
        });
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      console.error("❌ Error loading products:", errorMessage);
      setError(errorMessage);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refetch = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch,
    pagination,
  };
};

export const useProduct = (id: string | null) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (productId: string) => {
    try {
      setLoading(true);
      setError(null);

      const data = await productService.getProductById(productId);
      setProduct(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    } else {
      setProduct(null);
      setLoading(false);
      setError(null);
    }
  }, [id, fetchProduct]);

  const refetch = useCallback(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch,
    fetchProduct,
  };
};

export const useProductMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = useCallback(
    async (
      data: CreateProductData,
      files?: File[],
      authToken?: string,
    ): Promise<Product | null> => {
      try {
        setLoading(true);
        setError(null);

        const product = await productService.createProduct(
          data,
          files,
          authToken,
        );
        console.log("✅ Product created:", product);
        return product;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error creating product:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateProduct = useCallback(
    async (
      id: string,
      data: Partial<CreateProductData>,
      files?: File[],
      authToken?: string,
    ): Promise<Product | null> => {
      try {
        setLoading(true);
        setError(null);

        const product = await productService.updateProduct(
          id,
          data,
          files,
          authToken,
        );
        console.log("✅ Product updated:", product);
        return product;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error updating product:", errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const updateStock = useCallback(
    async (id: string, stockData: UpdateStockData): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const response = await productService.updateStock(id, stockData);

        if (response.success) {
          console.log("✅ Stock updated:", response.data);
          return true;
        } else {
          throw new Error(response.message || "Error al actualizar stock");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error updating stock:", errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const deleteProduct = useCallback(
    async (
      id: string,
      permanent: boolean = false,
      authToken?: string,
    ): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        await productService.deleteProduct(id, permanent, authToken);
        console.log("✅ Product deleted");
        return true;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Error desconocido";
        setError(errorMessage);
        console.error("❌ Error deleting product:", errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return {
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    loading,
    error,
  };
};

// Hook para productos destacados
export const useFeaturedProducts = () => {
  return useProducts({ featured: true, limit: 8 });
};

// Hook para búsqueda de productos
export const useProductSearch = (
  searchTerm: string,
  debounceMs: number = 300,
) => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  return useProducts({
    search: debouncedSearchTerm || undefined,
    limit: 20,
  });
};

// Hook para productos por categoría
export const useProductsByCategory = (categoryId: string | null) => {
  return useProducts({
    categoryId: categoryId || undefined,
    limit: 20,
  });
};
