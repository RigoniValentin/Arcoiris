import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./AboutPage.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } },
};

const AboutPage: React.FC = () => {
  const values = [
    {
      title: "Artesanía",
      description: "Cada pieza es trabajada a mano, cuidando cada detalle con pasión y dedicación.",
      icon: "◇",
    },
    {
      title: "Calidad",
      description: "Seleccionamos materiales nobles que garantizan durabilidad y belleza.",
      icon: "✦",
    },
    {
      title: "Autenticidad",
      description: "Diseños originales que reflejan identidad y personalidad única.",
      icon: "❋",
    },
    {
      title: "Compromiso",
      description: "Acompañamos a cada cliente en su experiencia de compra con dedicación.",
      icon: "✧",
    },
  ];

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroOverlay} />
          <motion.div
            className={styles.heroContent}
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.span className={styles.eyebrow} variants={fadeUp}>
              Nuestra Historia
            </motion.span>
            <motion.h1 className={styles.heroTitle} variants={fadeUp} custom={0.1}>
              Arcoiris Joyería
            </motion.h1>
            <motion.p className={styles.heroSubtitle} variants={fadeUp} custom={0.2}>
              Creamos joyas con alma desde el corazón de Argentina
            </motion.p>
          </motion.div>
        </section>

        {/* Story */}
        <section className={styles.story}>
          <div className={styles.container}>
            <div className={styles.storyGrid}>
              <motion.div
                className={styles.storyImage}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <img
                  src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=700&h=900&fit=crop"
                  alt="Artesanía en joyería"
                  loading="lazy"
                />
              </motion.div>
              <motion.div
                className={styles.storyContent}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.15 }}
              >
                <span className={styles.eyebrow}>Quiénes Somos</span>
                <h2 className={styles.storyTitle}>
                  Una pasión convertida en <span className={styles.accent}>oficio</span>
                </h2>
                <p className={styles.storyText}>
                  Arcoiris nació de la convicción de que la joyería es más que un
                  accesorio: es una forma de expresión. Cada pieza que creamos lleva
                  consigo horas de trabajo artesanal, atención al detalle y el deseo
                  de ofrecer algo verdaderamente especial.
                </p>
                <p className={styles.storyText}>
                  Trabajamos con materiales cuidadosamente seleccionados, combinando
                  técnicas tradicionales con diseño contemporáneo para crear joyas que
                  trascienden tendencias y se convierten en piezas atemporales.
                </p>
                <p className={styles.storyText}>
                  Nuestro compromiso va más allá del producto: buscamos construir
                  relaciones duraderas con cada cliente, acompañando sus momentos
                  más significativos con nuestras creaciones.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className={styles.values}>
          <div className={styles.container}>
            <motion.div
              className={styles.sectionHeader}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              <motion.span className={styles.eyebrow} variants={fadeUp}>
                Nuestros Valores
              </motion.span>
              <motion.h2 className={styles.sectionTitle} variants={fadeUp} custom={0.1}>
                Lo que nos define
              </motion.h2>
            </motion.div>

            <motion.div
              className={styles.valuesGrid}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={stagger}
            >
              {values.map((val, i) => (
                <motion.div
                  key={i}
                  className={styles.valueCard}
                  variants={fadeUp}
                  custom={i * 0.1}
                >
                  <span className={styles.valueIcon}>{val.icon}</span>
                  <h3 className={styles.valueTitle}>{val.title}</h3>
                  <p className={styles.valueDesc}>{val.description}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className={styles.cta}>
          <div className={styles.container}>
            <motion.div
              className={styles.ctaContent}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className={styles.ctaTitle}>¿Querés conocer nuestras piezas?</h2>
              <p className={styles.ctaText}>
                Explorá nuestra colección completa en la tienda online.
              </p>
              <Link to="/shop" className={styles.ctaBtn}>
                Ver Colección
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AboutPage;
