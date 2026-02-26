// Tipos compartidos para la aplicación de la tienda

// Respuestas de la API
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Tipos de entidades
export interface Category {
  _id?: string; // MongoDB ID
  id?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  productCount: number;
  parentCategoryId?: string; // ID de la categoría padre (opcional)
  isParent?: boolean; // Indica si es una categoría padre
  level?: number; // Nivel en la jerarquía (0 = raíz, 1 = subcategoría, etc.)
  subcategories?: Category[]; // Subcategorías anidadas (calculado en frontend)
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id?: string; // MongoDB ID
  id?: number; // Para compatibilidad con UI existente
  managementId?: number; // ID numérico del sistema de gestión
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId: string; // MongoDB ObjectId
  image: string;
  gallery: string[];
  inStock: boolean;
  stockCount: number;
  rating: number;
  reviews: number;
  featured: boolean;
  tags: string[];
  specifications: Record<string, string>;
  discount?: number;
  isAddingToCart?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Filtros
export interface CategoryFilters {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Category;
  sortOrder?: "asc" | "desc";
  updateCounts?: boolean;
}

export interface ProductFilters {
  category?: string | string[];
  categoryId?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  featured?: boolean;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: keyof Product;
  sortOrder?: "asc" | "desc";
}

// Datos para crear/actualizar
export interface CreateCategoryData {
  name: string;
  description: string;
  icon?: string;
  color?: string;
  parentCategoryId?: string; // ID de la categoría padre (opcional)
}

export interface CreateProductData {
  managementId?: number;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  categoryId: string;
  stockCount?: number;
  rating?: number;
  reviews?: number;
  featured?: boolean;
  tags?: string[];
  specifications?: Record<string, string>;
  gallery?: string[];
}

export interface UpdateStockData {
  stock: number;
  operation: "set" | "add" | "subtract";
}
