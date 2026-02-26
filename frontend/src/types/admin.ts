// Tipos para el panel de administración

// Roles del sistema
export type UserRole = "admin" | "vendedor" | "mayorista" | "minorista" | "manager";

export interface AdminUser {
  id: number;
  username: string;
  name: string;
  lastname: string;
  email: string;
  whatsapp?: string;
  location?: string;
  business?: string;
  role: UserRole;
  buyerType?: "minorista" | "mayorista";
  isAuthenticated: boolean;
  isApproved?: boolean; // Para mayoristas que necesitan aprobación
  createdAt?: string;
}

// Permisos por rol
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["all"],
  manager: ["products", "categories", "orders", "customers", "hero-slider"],
  vendedor: ["products", "orders", "customers"],
  mayorista: ["shop", "catalog", "wholesale-prices"],
  minorista: ["shop", "catalog"],
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  manager: "Gerente",
  vendedor: "Vendedor",
  mayorista: "Mayorista",
  minorista: "Minorista",
};

export type AdminSection =
  | "dashboard"
  | "products"
  | "categories"
  | "orders"
  | "customers"
  | "settings";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  featured: boolean;
  active: boolean;
  gallery?: string[];
  tags?: string[];
  specifications?: Record<string, string>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
  productCount: number;
}

export interface AdminMetrics {
  totalProducts: number;
  activeProducts: number;
  totalCategories: number;
  activeCategories: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  topProducts: Product[];
}

export interface CategoryForm {
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  categoryId: number;
  image: string;
  gallery: string[];
  stockCount: number;
  tags: string[];
  specifications: Record<string, string>;
}

export interface AdminStats {
  totalProducts: number;
  totalCategories: number;
  totalStock: number;
  lowStockProducts: number;
  featuredProducts: number;
  averageRating: number;
  totalSales: number;
  totalUsers: number;
  salesGrowth?: number;
  userGrowth?: number;
  revenueGrowth?: number;
  topSellingProducts?: { id: number; name: string; sales: number }[];
  lastMonthSales?: number;
  lastMonthUsers?: number;
}

export type AdminView = "dashboard" | "categories" | "products" | "settings";
export type ModalType =
  | "none"
  | "add-category"
  | "edit-category"
  | "delete-category"
  | "add-product"
  | "edit-product"
  | "delete-product";
export type EditMode = "create" | "edit";
