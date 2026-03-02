import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProductsManagementPremium } from "./sections/admin/ProductsManagement";
import { CategoriesManagementPremium } from "./sections/admin/CategoriesManagement";
import { AdminModalsPremium } from "./sections/admin/AdminModals";
import { HeroSliderManager } from "../admin/HeroSliderManager";
import {
  GlobalNotification,
  NotificationData,
} from "../common/GlobalNotification";
import { Product, Category } from "../../types/shop";
import { useCategories } from "../../hooks/useCategories";
import { useProducts } from "../../hooks/useProducts";
import { getLoggedUser } from "../../utils/whatsappUtils";
import logoImg from "../../assets/Logos/Logo.png";
import styles from "./AdminPanel.module.css";

type AdminSection =
  | "dashboard"
  | "products"
  | "categories"
  | "hero-slides"
  | "orders";

interface DashboardStats {
  products: number;
  categories: number;
  featured: number;
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal state (for CRUD)
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [globalNotification, setGlobalNotification] =
    useState<NotificationData | null>(null);

  // Check auth
  useEffect(() => {
    const user = getLoggedUser();
    if (!user || !user.isAdmin) {
      navigate("/login");
      return;
    }
    setCurrentUser(user);
  }, [navigate]);

  // Data hooks
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategories({
    sortBy: "name",
    sortOrder: "asc",
    limit: 50,
  });

  const [adminPage, setAdminPage] = useState(1);
  const [adminLimit] = useState(20);

  const {
    products,
    loading: productsLoading,
    error: productsError,
    refetch: refetchProducts,
    pagination,
  } = useProducts({
    sortBy: "name",
    sortOrder: "asc",
    page: adminPage,
    limit: adminLimit,
  });

  // Notification helper
  const showNotification = (notification: Omit<NotificationData, "id">) => {
    setGlobalNotification({
      ...notification,
      id: Date.now().toString(),
    });
  };

  // ─── Product Handlers ───
  const handleAddProduct = () => setShowModal("add-product");

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowModal("edit-product");
  };

  const handleDeleteProduct = async (
    productId: number,
    filteredProducts?: Product[],
  ) => {
    let productToDelete = products.find((p) => {
      const pId = p.id || (p._id ? parseInt(p._id, 10) : undefined);
      return pId === productId;
    });

    if (!productToDelete && filteredProducts?.length) {
      productToDelete = filteredProducts.find((p) => {
        const pId = p.id || (p._id ? parseInt(p._id, 10) : undefined);
        return pId === productId;
      });
    }

    if (!productToDelete) {
      try {
        const { productService } = await import("../../services/productService");
        const searchResults = await productService.getAllProducts({
          search: productId.toString(),
          limit: 1000,
        });
        productToDelete = searchResults.find(
          (p: Product) =>
            p.managementId === productId ||
            p.id === productId ||
            (p._id && parseInt(p._id, 10) === productId)
        );
      } catch (error) {
        console.error("Error searching product:", error);
      }

      if (!productToDelete) {
        showNotification({
          type: "warning",
          title: "Producto no encontrado",
          message: `El producto ID ${productId} no existe en el servidor.`,
          duration: 6000,
        });
        handleDataRefresh();
        return;
      }
    }

    setSelectedProduct(productToDelete);
    setShowModal("delete-product");
  };

  // ─── Category Handlers ───
  const handleAddCategory = () => setShowModal("add-category");

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowModal("edit-category");
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowModal("delete-category");
  };

  // ─── Sync & Refresh ───
  const syncCountersQuietly = async () => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token) {
          const { CategoryService } = await import("../../services/categoryService");
          await CategoryService.updateProductCounts(user.token);
        }
      }
    } catch (error) {
      console.warn("Error syncing counters:", error);
    }
  };

  const handleDataRefresh = async () => {
    await syncCountersQuietly();
    refetchProducts();
    refetchCategories();
  };

  const handleManualSync = async () => {
    try {
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token) {
          const { CategoryService } = await import("../../services/categoryService");
          await CategoryService.updateProductCounts(user.token);
        }
      }
      refetchProducts();
      refetchCategories();
      showNotification({
        type: "success",
        title: "Datos sincronizados",
        message: "Los contadores de productos se han actualizado correctamente",
        duration: 3000,
      });
    } catch (error) {
      refetchProducts();
      refetchCategories();
      showNotification({
        type: "warning",
        title: "Sincronización parcial",
        message: "Se refrescaron los datos, pero puede haber un desfase en los contadores",
        duration: 4000,
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("authToken");
    navigate("/login");
  };

  const menuItems: { id: AdminSection; label: string; icon: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "products", label: "Productos", icon: "💍" },
    { id: "categories", label: "Categorías", icon: "📂" },
    { id: "hero-slides", label: "Hero Slider", icon: "🖼️" },
    { id: "orders", label: "Pedidos", icon: "📦" },
  ];

  if (!currentUser) return null;

  // ─── Render section content ───
  const renderContent = () => {
    if (activeSection === "dashboard") {
      return (
        <DashboardView
          stats={{
            products: products.length,
            categories: categories.length,
            featured: products.filter((p) => p.featured).length,
          }}
          loading={productsLoading || categoriesLoading}
          onNavigate={setActiveSection}
        />
      );
    }

    if (activeSection === "orders") {
      return (
        <PlaceholderView
          title="Pedidos"
          message="Módulo de pedidos próximamente disponible."
        />
      );
    }

    if (categoriesLoading || productsLoading) {
      return <div className={styles.loadingState}>Cargando...</div>;
    }

    if (categoriesError || productsError) {
      return (
        <div className={styles.errorState}>
          <p>Error: {categoriesError || productsError}</p>
          <button onClick={handleDataRefresh} className={styles.retryBtn}>
            Reintentar
          </button>
        </div>
      );
    }

    switch (activeSection) {
      case "products":
        return (
          <ProductsManagementPremium
            products={products}
            categories={categories}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            pagination={pagination}
            onPageChange={setAdminPage}
          />
        );
      case "categories":
        return (
          <CategoriesManagementPremium
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
            onSyncCounters={handleManualSync}
          />
        );
      case "hero-slides":
        return <HeroSliderManager />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarHeader}>
          <Link to="/" className={styles.logoLink}>
            <img src={logoImg} alt="Arcoiris" className={styles.logo} />
          </Link>
          <span className={styles.panelLabel}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`${styles.navItem} ${activeSection === item.id ? styles.navItemActive : ""}`}
              onClick={() => {
                setActiveSection(item.id);
                setSidebarOpen(false);
              }}
            >
              <span className={styles.navIcon}>{item.icon}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {currentUser.name?.charAt(0).toUpperCase()}
            </div>
            <div className={styles.userDetails}>
              <span className={styles.userNameSidebar}>{currentUser.name}</span>
              <span className={styles.userRole}>Administrador</span>
            </div>
          </div>
          <button onClick={handleLogout} className={styles.logoutSidebar}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topBar}>
          <button
            className={styles.menuToggle}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span />
            <span />
            <span />
          </button>
          <h1 className={styles.pageTitle}>
            {menuItems.find((m) => m.id === activeSection)?.icon}{" "}
            {menuItems.find((m) => m.id === activeSection)?.label}
          </h1>
          <Link to="/shop" className={styles.viewShopLink}>
            Ver Tienda →
          </Link>
        </header>

        {/* Content */}
        <div className={styles.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Modales CRUD */}
      {showModal && (
        <AdminModalsPremium
          type={showModal}
          product={selectedProduct}
          category={selectedCategory}
          categories={categories}
          onClose={() => {
            setShowModal(null);
            setSelectedProduct(null);
            setSelectedCategory(null);
          }}
          onSave={() => {
            setShowModal(null);
            setSelectedProduct(null);
            setSelectedCategory(null);
            handleDataRefresh();
          }}
        />
      )}

      {/* Notificaciones Globales */}
      <GlobalNotification
        notification={globalNotification}
        onClose={() => setGlobalNotification(null)}
      />
    </div>
  );
};

/* ─── Dashboard View ─── */
const DashboardView: React.FC<{
  stats: DashboardStats;
  loading: boolean;
  onNavigate: (section: AdminSection) => void;
}> = ({ stats, loading, onNavigate }) => (
  <div className={styles.dashboardGrid}>
    <div className={styles.statCard} onClick={() => onNavigate("products")}>
      <span className={styles.statIcon}>💍</span>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{loading ? "…" : stats.products}</span>
        <span className={styles.statLabel}>Productos</span>
      </div>
    </div>
    <div className={styles.statCard} onClick={() => onNavigate("categories")}>
      <span className={styles.statIcon}>📂</span>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{loading ? "…" : stats.categories}</span>
        <span className={styles.statLabel}>Categorías</span>
      </div>
    </div>
    <div className={styles.statCard} onClick={() => onNavigate("products")}>
      <span className={styles.statIcon}>⭐</span>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>{loading ? "…" : stats.featured}</span>
        <span className={styles.statLabel}>Destacados</span>
      </div>
    </div>
    <div className={styles.statCard} onClick={() => onNavigate("hero-slides")}>
      <span className={styles.statIcon}>🖼️</span>
      <div className={styles.statInfo}>
        <span className={styles.statValue}>—</span>
        <span className={styles.statLabel}>Hero Slides</span>
      </div>
    </div>

    <div className={styles.quickActions}>
      <h3 className={styles.quickActionsTitle}>Acciones Rápidas</h3>
      <div className={styles.quickActionsList}>
        <button className={styles.quickAction} onClick={() => onNavigate("products")}>
          <span>💍</span> Gestionar Productos
        </button>
        <button className={styles.quickAction} onClick={() => onNavigate("categories")}>
          <span>📂</span> Gestionar Categorías
        </button>
        <button className={styles.quickAction} onClick={() => onNavigate("hero-slides")}>
          <span>🖼️</span> Configurar Slider
        </button>
      </div>
    </div>
  </div>
);

/* ─── Placeholder View ─── */
const PlaceholderView: React.FC<{ title: string; message: string }> = ({
  title,
  message,
}) => (
  <div className={styles.placeholder}>
    <div className={styles.placeholderIcon}>🚧</div>
    <h3 className={styles.placeholderTitle}>{title}</h3>
    <p className={styles.placeholderText}>{message}</p>
  </div>
);

export default AdminPanel;
