import React, { useState } from "react";
import { ProductsManagementPremium } from "./ProductsManagement";
import { CategoriesManagementPremium } from "./CategoriesManagement";
import { AdminModalsPremium } from "./AdminModals";
import {
  GlobalNotification,
  NotificationData,
} from "../../../common/GlobalNotification";
import { HeroSliderManager } from "../../../admin/HeroSliderManager";
import { Product, Category } from "../../../../types/shop";
import { useCategories } from "../../../../hooks/useCategories";
import { useProducts } from "../../../../hooks/useProducts";
import styles from "./AdminPanel.module.css";

export type AdminSection = "products" | "categories" | "hero-slider";

interface AdminPanelPremiumProps {
  onBack: () => void;
}

export const AdminPanelPremium: React.FC<AdminPanelPremiumProps> = ({
  onBack: _onBack,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>("products");
  const [showModal, setShowModal] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );
  const [globalNotification, setGlobalNotification] =
    useState<NotificationData | null>(null);

  // Función para mostrar notificaciones globales
  const showNotification = (notification: Omit<NotificationData, "id">) => {
    setGlobalNotification({
      ...notification,
      id: Date.now().toString(),
    });
  };

  // Usar hooks para obtener datos de la API
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

  // Estados para paginación del admin
  const [adminPage, setAdminPage] = useState(1);
  const [adminLimit] = useState(20); // 20 productos por página en admin

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

  // Handlers para productos
  const handleAddProduct = async () => {
    setShowModal("add-product");
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowModal("edit-product");
  };

  const handleDeleteProduct = async (
    productId: number,
    filteredProducts?: Product[],
  ) => {
    // Buscar el producto completo para pasarlo al modal
    // Buscar tanto por id como por _id (convertido a number)
    let productToDelete = products.find((p) => {
      const pId = p.id || (p._id ? parseInt(p._id, 10) : undefined);
      return pId === productId;
    });

    // Si no se encuentra en products y hay productos filtrados, buscar ahí también
    if (!productToDelete && filteredProducts && filteredProducts.length > 0) {
      console.log(
        "🔍 Product not found in main list, searching in filtered products...",
      );
      productToDelete = filteredProducts.find((p) => {
        const pId = p.id || (p._id ? parseInt(p._id, 10) : undefined);
        return pId === productId;
      });

      if (productToDelete) {
        console.log(
          "✅ Product found in filtered products:",
          productToDelete.name,
        );
      }
    }

    if (!productToDelete) {
      console.warn(
        "⚠️ Product not found in current list, searching in API for ID:",
        productId,
      );

      try {
        // Intentar buscar el producto en la API por managementId o ID
        const { productService } = await import(
          "../../../../services/productService"
        );

        // Obtener token de usuario
        const userData = localStorage.getItem("userData");
        if (userData) {
          const user = JSON.parse(userData);
          if (user.token) {
            // Buscar productos que coincidan con este ID con búsqueda más amplia
            console.log("🔍 Searching with comprehensive API call...");
            const searchResults = await productService.getAllProducts({
              search: productId.toString(),
              limit: 1000, // Búsqueda más amplia
            });

            console.log(`🔍 Search results count: ${searchResults.length}`);

            // Buscar producto por múltiples criterios
            productToDelete = searchResults.find((p: Product) => {
              const matches =
                p.managementId === productId ||
                p.id === productId ||
                (p._id && parseInt(p._id, 10) === productId) ||
                (typeof p._id === "string" &&
                  p._id.includes(productId.toString()));

              if (matches) {
                console.log("🎯 Found matching product:", p);
              }
              return matches;
            });

            if (productToDelete) {
              console.log(
                "✅ Product found in comprehensive API search:",
                productToDelete,
              );
            } else {
              console.log("❌ Product not found even in comprehensive search");
              console.log(
                "🔍 Sample of found products:",
                searchResults.slice(0, 3).map((p) => ({
                  id: p.id,
                  managementId: p.managementId,
                  _id: p._id,
                  name: p.name,
                })),
              );
            }
          }
        }
      } catch (error) {
        console.error("❌ Error searching product in API:", error);
      }

      // Si aún no se encuentra, mostrar advertencia al usuario antes de crear placeholder
      if (!productToDelete) {
        console.warn(
          "⚠️ Product not found in backend - may have been deleted by another admin",
        );
        showNotification({
          type: "warning",
          title: "Producto no encontrado",
          message: `El producto ID ${productId} no existe en el servidor. Puede haber sido eliminado por otro administrador. Los datos se refrescarán automáticamente.`,
          duration: 6000,
        });

        // Refrescar datos automáticamente
        handleDataRefresh();
        return; // No mostrar el modal de eliminación
      }
    }

    setSelectedProduct(productToDelete);
    setShowModal("delete-product");
  };

  // Handlers para categorías
  const handleAddCategory = async () => {
    setShowModal("add-category");
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowModal("edit-category");
  };

  const handleDeleteCategory = async (category: Category) => {
    setSelectedCategory(category);
    setShowModal("delete-category");
  };

  // Función para sincronizar contadores sin notificación (automática)
  const syncCountersQuietly = async () => {
    try {
      console.log("🔄 Sincronizando contadores automáticamente...");
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token) {
          const { CategoryService } = await import(
            "../../../../services/categoryService"
          );
          await CategoryService.updateProductCounts(user.token);
          console.log("✅ Contadores sincronizados automáticamente");
        }
      }
    } catch (error) {
      console.warn("⚠️ Error sincronizando contadores automáticamente:", error);
    }
  };

  // Función para refrescar datos después de operaciones (automática)
  const handleDataRefresh = async () => {
    console.log("🔄 Refrescando datos y sincronizando contadores...");
    // Sincronizar contadores silenciosamente
    await syncCountersQuietly();

    // Refrescar los datos
    refetchProducts();
    refetchCategories();
    console.log("✅ Datos refrescados");
  };

  // Función para sincronización manual (con notificación)
  const handleManualSync = async () => {
    try {
      // Primero actualizamos los contadores de productos en el backend
      const userData = localStorage.getItem("userData");
      if (userData) {
        const user = JSON.parse(userData);
        if (user.token) {
          // Importar CategoryService dinámicamente para evitar problemas de dependencias circulares
          const { CategoryService } = await import(
            "../../../../services/categoryService"
          );
          await CategoryService.updateProductCounts(user.token);
        }
      }

      // Luego refrescamos los datos
      refetchProducts();
      refetchCategories();

      showNotification({
        type: "success",
        title: "Datos sincronizados",
        message: "Los contadores de productos se han actualizado correctamente",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error sincronizando contadores:", error);

      // Aún así refrescamos los datos para obtener la info más reciente
      refetchProducts();
      refetchCategories();

      showNotification({
        type: "warning",
        title: "Sincronización parcial",
        message:
          "Se refrescaron los datos, pero puede haber un desfase en los contadores",
        duration: 4000,
      });
    }
  };

  const renderContent = () => {
    if (categoriesLoading || productsLoading) {
      return (
        <div className={styles.loadingContainer}>
          <div className={styles.loader}>Cargando...</div>
        </div>
      );
    }

    if (categoriesError || productsError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorMessage}>
            Error: {categoriesError || productsError}
          </div>
          <button onClick={handleDataRefresh} className={styles.retryButton}>
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
      case "hero-slider":
        return <HeroSliderManager />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.adminPanel}>
      {/* Navegación lateral */}
      <nav className={styles.sidebar}>
        <div className={styles.navigationMenu}>
          <button
            onClick={() => setActiveSection("products")}
            className={`${styles.navItem} ${activeSection === "products" ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>📦</span>
            <span className={styles.navLabel}>Productos</span>
            {productsLoading && <span className={styles.loadingDot}>⏳</span>}
          </button>

          <button
            onClick={() => setActiveSection("categories")}
            className={`${styles.navItem} ${activeSection === "categories" ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>🏷️</span>
            <span className={styles.navLabel}>Categorías</span>
            {categoriesLoading && <span className={styles.loadingDot}>⏳</span>}
          </button>

          <button
            onClick={() => setActiveSection("hero-slider")}
            className={`${styles.navItem} ${activeSection === "hero-slider" ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>🖼️</span>
            <span className={styles.navLabel}>Hero Slider</span>
          </button>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className={styles.mainContent}>{renderContent()}</main>

      {/* Modales */}
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
            handleDataRefresh(); // Refrescar datos después de guardar
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
