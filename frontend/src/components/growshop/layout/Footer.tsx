import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import styles from "./Footer.module.css";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      {/* Línea dorada superior */}
      <div className={styles.goldLine} />

      <div className={styles.container}>
        <div className={styles.grid}>
          {/* Brand */}
          <motion.div
            className={styles.brand}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.logoGroup}>
              <span className={styles.logoIcon}>◇</span>
              <div>
                <h3 className={styles.logoName}>ARCOIRIS</h3>
                <span className={styles.logoSub}>JOYERÍA</span>
              </div>
            </div>
            <p className={styles.brandDescription}>
              Joyería artesanal de autor. Cada pieza cuenta una historia única,
              diseñada con pasión y dedicación para quienes valoran lo auténtico.
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            className={styles.column}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className={styles.columnTitle}>Navegación</h4>
            <div className={styles.links}>
              <Link to="/" className={styles.link}>Inicio</Link>
              <Link to="/shop" className={styles.link}>Tienda</Link>
              <Link to="/contacto" className={styles.link}>Contacto</Link>
            </div>
          </motion.div>

          {/* Services */}
          <motion.div
            className={styles.column}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className={styles.columnTitle}>Servicios</h4>
            <div className={styles.links}>
              <Link to="/shop" className={styles.link}>Venta Minorista</Link>
              <Link to="/shop" className={styles.link}>Venta Mayorista</Link>
              <Link to="/registro" className={styles.link}>Crear Cuenta</Link>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div
            className={styles.column}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className={styles.columnTitle}>Contacto</h4>
            <div className={styles.contactInfo}>
              <a
                href="https://wa.me/5493584192268"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                WhatsApp
              </a>
              <a
                href="https://instagram.com/arcoiris.joyeria"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.link}
              >
                Instagram
              </a>
              <a href="mailto:contacto@arcoirisjoyeria.com" className={styles.link}>
                Email
              </a>
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <div className={styles.bottom}>
          <p className={styles.copyright}>
            © {currentYear} Arcoiris Joyería. Todos los derechos reservados.
          </p>
          <div className={styles.bottomLinks}>
            <span className={styles.bottomLink}>Términos y Condiciones</span>
            <span className={styles.separator}>·</span>
            <span className={styles.bottomLink}>Política de Privacidad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
