import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./Navbar.module.css";
import { getLoggedUser } from "../../../utils/whatsappUtils";
import logoImg from "../../../assets/Logos/Logo.png";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const user = getLoggedUser();
    setCurrentUser(user);
    const interval = setInterval(() => {
      const u = getLoggedUser();
      setCurrentUser(u);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("authToken");
    setCurrentUser(null);
  };

  const navLinks = [
    { to: "/", label: "Inicio" },
    { to: "/shop", label: "Tienda" },
    { to: "/contacto", label: "Contacto" },
  ];

  return (
    <>
      <motion.header
        className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className={styles.container}>
          {/* Logo */}
          <Link to="/" className={styles.logo}>
            <img src={logoImg} alt="Arcoiris's - Joyería a tu alcance" className={styles.logoImage} />
          </Link>

          {/* Desktop Nav */}
          <nav className={styles.desktopNav}>
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`${styles.navLink} ${location.pathname === link.to ? styles.active : ""}`}
              >
                {link.label}
                {location.pathname === link.to && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="navbar-indicator"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className={styles.actions}>
            {currentUser ? (
              <div className={styles.userMenu}>
                <span className={styles.userName}>
                  {currentUser.name}
                </span>
                {currentUser.isAdmin && (
                  <span className={styles.adminBadge}>Admin</span>
                )}
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  Salir
                </button>
              </div>
            ) : (
              <Link to="/registro" className={styles.registerBtn}>
                Crear Cuenta
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            className={`${styles.mobileToggle} ${isMobileMenuOpen ? styles.open : ""}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menú"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              className={styles.mobileOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              className={styles.mobileMenu}
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className={styles.mobileMenuHeader}>
                <span className={styles.mobileMenuTitle}>Menú</span>
                <button
                  className={styles.mobileClose}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className={styles.mobileMenuLinks}>
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <Link
                      to={link.to}
                      className={`${styles.mobileLink} ${location.pathname === link.to ? styles.mobileActive : ""}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className={styles.mobileMenuFooter}>
                {currentUser ? (
                  <>
                    <div className={styles.mobileUser}>
                      <span>{currentUser.name} {currentUser.lastname}</span>
                      {currentUser.isAdmin && <span className={styles.adminBadge}>Admin</span>}
                    </div>
                    <button onClick={handleLogout} className={styles.mobileLogout}>
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <Link
                    to="/registro"
                    className={styles.mobileRegisterBtn}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Crear Cuenta
                  </Link>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
