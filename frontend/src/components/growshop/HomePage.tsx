import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./HomePage.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const HomePage: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const scrollToElement = (retries = 0) => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        } else if (retries < 15) {
          setTimeout(() => scrollToElement(retries + 1), 100);
        }
      };
      setTimeout(() => scrollToElement(), 200);
    }
  }, [location.hash]);

  const collections = [
    {
      title: "Anillos",
      image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&h=750&fit=crop",
      description: "Elegancia en cada detalle",
    },
    {
      title: "Collares",
      image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&h=750&fit=crop",
      description: "Piezas que iluminan",
    },
    {
      title: "Pulseras",
      image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=600&h=750&fit=crop",
      description: "Arte para llevar",
    },
    {
      title: "Aros",
      image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=750&fit=crop",
      description: "Brillo natural",
    },
  ];

  const features = [
    {
      icon: "◇",
      title: "Diseño Artesanal",
      description: "Cada pieza es creada a mano con materiales de primera calidad.",
    },
    {
      icon: "✦",
      title: "Envíos Seguros",
      description: "Enviamos a todo el país con empaque premium y seguimiento.",
    },
    {
      icon: "❋",
      title: "Garantía Total",
      description: "Respaldamos cada joya con garantía de calidad y autenticidad.",
    },
  ];

  return (
    <div className={styles.homePage}>
      <Navbar />

      <main className={styles.main}>
        {/* ═══ HERO SECTION ═══ */}
        <section className={styles.hero}>
          {/* Animated Background Slideshow — Ken Burns */}
          <div className={styles.heroBgSlideshow}>
            <div className={`${styles.heroBgSlide} ${styles.heroBgSlide1}`} />
            <div className={`${styles.heroBgSlide} ${styles.heroBgSlide2}`} />
            <div className={`${styles.heroBgSlide} ${styles.heroBgSlide3}`} />
          </div>

          <div className={styles.heroOverlay} />

          {/* Floating golden particles */}
          <div className={styles.heroParticles}>
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} />
            ))}
          </div>

          {/* Hero Content — Split Layout */}
          <div className={styles.heroContent}>
            <motion.div
              className={styles.heroLeft}
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.span
                className={styles.heroEyebrow}
                variants={fadeUp}
                custom={0}
              >
                ✦ Joyería Artesanal de Autor
              </motion.span>
              <motion.h1
                className={styles.heroTitle}
                variants={fadeUp}
                custom={0.15}
              >
                Belleza que
                <br />
                <span className={styles.heroAccent}>trasciende</span>
              </motion.h1>
              <motion.p
                className={styles.heroSubtitle}
                variants={fadeUp}
                custom={0.3}
              >
                Joyas diseñadas con alma. Piezas únicas que cuentan tu historia
                y reflejan tu esencia.
              </motion.p>
              <motion.div
                className={styles.heroActions}
                variants={fadeUp}
                custom={0.45}
              >
                <Link to="/shop" className={styles.heroPrimaryBtn}>
                  Explorar Colección
                  <span className={styles.btnArrow}>→</span>
                </Link>
                <Link to="/shop" className={styles.heroSecondaryBtn}>
                  Ver Catálogo
                </Link>
              </motion.div>

              {/* Glass Stats */}
              <motion.div
                className={styles.heroStats}
                variants={fadeUp}
                custom={0.65}
              >
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>500+</span>
                  <span className={styles.statLabel}>Diseños únicos</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>100%</span>
                  <span className={styles.statLabel}>Hecho a mano</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>24hs</span>
                  <span className={styles.statLabel}>Envío express</span>
                </div>
              </motion.div>
            </motion.div>

            {/* Floating Showcase */}
            <motion.div
              className={styles.heroShowcase}
              initial={{ opacity: 0, x: 60, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className={styles.showcaseGlow} />
              <motion.div
                className={styles.showcaseCard}
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=500&h=600&fit=crop"
                  alt="Joya destacada"
                  className={styles.showcaseImage}
                />
                <div className={styles.showcaseInfo}>
                  <span className={styles.showcaseLabel}>Destacado</span>
                  <span className={styles.showcaseName}>Colección Eterna</span>
                </div>
              </motion.div>

              {/* Floating mini badges */}
              <motion.div
                className={`${styles.floatingBadge} ${styles.floatingBadge1}`}
                animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              >
                ◇ Artesanal
              </motion.div>
              <motion.div
                className={`${styles.floatingBadge} ${styles.floatingBadge2}`}
                animate={{ y: [0, -8, 0], rotate: [0, -2, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                ✦ Premium
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            className={styles.scrollIndicator}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <motion.div
              className={styles.scrollMouse}
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className={styles.scrollDot} />
            </motion.div>
            <span className={styles.scrollText}>Scroll</span>
          </motion.div>
        </section>

        {/* ═══ FEATURES SECTION ═══ */}
        <section className={styles.features}>
          <div className={styles.container}>
            <motion.div
              className={styles.featuresGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              {features.map((feat, i) => (
                <motion.div
                  key={i}
                  className={styles.featureCard}
                  variants={fadeUp}
                  custom={i * 0.1}
                >
                  <span className={styles.featureIcon}>{feat.icon}</span>
                  <h3 className={styles.featureTitle}>{feat.title}</h3>
                  <p className={styles.featureDesc}>{feat.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══ COLLECTIONS SECTION ═══ */}
        <section className={styles.collections} id="colecciones">
          <div className={styles.containerWide}>
            <motion.div
              className={styles.sectionHeader}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={stagger}
            >
              <motion.span className={styles.sectionEyebrow} variants={fadeUp}>
                Colecciones
              </motion.span>
              <motion.h2 className={styles.sectionTitle} variants={fadeUp} custom={0.1}>
                Explorá nuestras categorías
              </motion.h2>
              <motion.p className={styles.sectionSubtitle} variants={fadeUp} custom={0.2}>
                Cada colección refleja nuestra pasión por el diseño y la artesanía
              </motion.p>
            </motion.div>

            <motion.div
              className={styles.collectionsGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={stagger}
            >
              {collections.map((col, i) => (
                <motion.div
                  key={i}
                  className={styles.collectionCard}
                  variants={fadeUp}
                  custom={i * 0.1}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.4 }}
                >
                  <Link to="/shop" className={styles.collectionLink}>
                    <div className={styles.collectionImageWrapper}>
                      <img
                        src={col.image}
                        alt={col.title}
                        className={styles.collectionImage}
                        loading="lazy"
                      />
                      <div className={styles.collectionOverlay} />
                    </div>
                    <div className={styles.collectionInfo}>
                      <h3 className={styles.collectionName}>{col.title}</h3>
                      <p className={styles.collectionDesc}>{col.description}</p>
                      <span className={styles.collectionCta}>
                        Ver más →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>



        {/* ═══ WHOLESALE CTA ═══ */}
        <section className={styles.wholesaleCta}>
          <motion.div
            className={styles.container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className={styles.wholesaleContent}>
              <motion.span className={styles.wholesaleEyebrow} variants={fadeUp}>
                Para emprendedores
              </motion.span>
              <motion.h2 className={styles.wholesaleTitle} variants={fadeUp} custom={0.1}>
                ¿Vendés joyas en tu negocio?
              </motion.h2>
              <motion.p className={styles.wholesaleText} variants={fadeUp} custom={0.2}>
                Ofrecemos precios diferenciados para compras por mayor.
                Contactá con nuestro equipo para recibir el catálogo exclusivo
                con condiciones especiales.
              </motion.p>
              <motion.div className={styles.wholesaleActions} variants={fadeUp} custom={0.3}>
                <a
                  href="https://wa.me/5493584192268?text=Hola,%20me%20interesa%20la%20venta%20por%20mayor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.wholesaleBtn}
                >
                  Contactar por WhatsApp
                </a>
                <Link to="/registro" className={styles.wholesaleSecondaryBtn}>
                  Crear Cuenta Mayorista
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* ═══ NEWSLETTER ═══ */}
        <section className={styles.newsletter}>
          <div className={styles.container}>
            <motion.div
              className={styles.newsletterContent}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className={styles.newsletterTitle}>
                Mantenete al día con nuestras novedades
              </h3>
              <p className={styles.newsletterText}>
                Nuevas colecciones, ofertas exclusivas y más.
              </p>
              <div className={styles.newsletterForm}>
                <input
                  type="email"
                  placeholder="Tu email"
                  className={styles.newsletterInput}
                />
                <button className={styles.newsletterBtn}>Suscribirse</button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;
