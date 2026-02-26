import React, { useState, useEffect } from "react";
import ShopSection from "./sections/shop/ShopSection";
import { AdminPanelPremium } from "./sections/admin/AdminPanel";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./ShopApp.module.css";
import { getLoggedUser } from "../../utils/whatsappUtils";

// Nota: Los datos iniciales se han movido al componente AdminPanel

const ShopApp: React.FC = () => {
  const [view, setView] = useState<"shop" | "admin">("shop");
  const [isScrolled, setIsScrolled] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Cargar usuario al inicializar y escuchar cambios en localStorage
  useEffect(() => {
    const loadUser = () => {
      const user = getLoggedUser();
      setCurrentUser(user);
    };

    // Cargar usuario inicial
    loadUser();

    // Escuchar cambios en localStorage
    const handleStorageChange = () => {
      loadUser();
    };

    window.addEventListener("storage", handleStorageChange);

    // También escuchar cambios manuales en el mismo tab
    const checkUserInterval = setInterval(loadUser, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(checkUserInterval);
    };
  }, []);

  // Efecto para hacer scroll al top cuando se monta el componente ShopApp
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    setCurrentUser(null);
    setView("shop");
  };

  // Determinar si el usuario actual es admin
  const isAdmin = currentUser?.isAdmin || false;

  return (
    <div className={styles.shopApp}>
      {/* Navbar Principal */}
      <Navbar />

      {/* Shop Navigation Bar - Solo mostrar si hay un admin logueado */}
      {isAdmin && (
        <div
          className={`${styles.shopNavigation} ${isScrolled ? styles.scrolled : ""}`}
        >
          <div className={styles.shopNavContent}>
            <div className={styles.shopNavLeft}>
              <h2 className={styles.shopTitle}>
                {view === "shop" ? "Tienda" : "Panel de Administración"}
              </h2>
            </div>

            <nav className={styles.shopNavButtons}>
              <button
                className={`${styles.navButton} ${view === "shop" ? styles.active : ""}`}
                onClick={() => setView("shop")}
              >
                <span className={styles.navIcon}>🛍️</span>
                Tienda
              </button>

              <button
                className={`${styles.navButton} ${view === "admin" ? styles.active : ""}`}
                onClick={() => setView("admin")}
              >
                <span className={styles.navIcon}>⚙️</span>
                Admin
              </button>

              <div className={styles.authButtons}>
                <button className={styles.logoutButton} onClick={handleLogout}>
                  <span className={styles.logoutIcon}>🚪</span>
                  Salir
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={styles.mainContent}>
        {view === "shop" ? (
          <ShopSection />
        ) : (
          <div className={styles.adminContainer}>
            <div className={styles.adminFullWidth}>
              <AdminPanelPremium onBack={() => setView("shop")} />
            </div>
          </div>
        )}
      </main>

      {/* Botón flotante para admin cuando está logueado */}
      {isAdmin && (
        <button
          className={styles.adminFloatingButton}
          onClick={() => setView(view === "admin" ? "shop" : "admin")}
          title={view === "admin" ? "Ir a Tienda" : "Panel de Administración"}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            {view === "admin" ? (
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.41C5.04 14.4 5 14.7 5 15c0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.42-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            ) : (
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
            )}
          </svg>
        </button>
      )}

      <Footer />
    </div>
  );
};

export default ShopApp;
