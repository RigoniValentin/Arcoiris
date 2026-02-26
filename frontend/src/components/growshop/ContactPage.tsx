import React, { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./ContactPage.module.css";

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

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    asunto: "",
    mensaje: "",
  });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = [
      `*Consulta desde la web*`,
      ``,
      `👤 *Nombre:* ${form.nombre}`,
      `📧 *Email:* ${form.email}`,
      `📌 *Asunto:* ${form.asunto}`,
      `💬 *Mensaje:* ${form.mensaje}`,
    ].join("\n");
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/5493584192268?text=${encoded}`, "_blank");
    setSent(true);
  };

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
              Contacto
            </motion.span>
            <motion.h1 className={styles.heroTitle} variants={fadeUp} custom={0.1}>
              Hablemos
            </motion.h1>
            <motion.p className={styles.heroSubtitle} variants={fadeUp} custom={0.2}>
              Estamos para acompañarte. Escribinos y te respondemos a la brevedad.
            </motion.p>
          </motion.div>
        </section>

        <section className={styles.content}>
          <div className={styles.container}>
            <div className={styles.grid}>
              {/* Contact Info */}
              <motion.div
                className={styles.infoPanel}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={stagger}
              >
                <motion.div className={styles.contactCard} variants={fadeUp}>
                  <div className={styles.contactIcon}>📲</div>
                  <h3 className={styles.contactTitle}>WhatsApp</h3>
                  <p className={styles.contactDetail}>
                    <a href="https://wa.me/5493584192268" target="_blank" rel="noopener noreferrer">
                      +54 9 358 419-2268
                    </a>
                  </p>
                  <p className={styles.contactNote}>Lun a Sáb · 9:00 a 20:00</p>
                </motion.div>

                <motion.div className={styles.contactCard} variants={fadeUp}>
                  <div className={styles.contactIcon}>📧</div>
                  <h3 className={styles.contactTitle}>Email</h3>
                  <p className={styles.contactDetail}>
                    <a href="mailto:contacto@arcoirisjoyeria.com">
                      contacto@arcoirisjoyeria.com
                    </a>
                  </p>
                  <p className={styles.contactNote}>Respondemos en 24hs</p>
                </motion.div>

                <motion.div className={styles.contactCard} variants={fadeUp}>
                  <div className={styles.contactIcon}>📍</div>
                  <h3 className={styles.contactTitle}>Redes Sociales</h3>
                  <div className={styles.socialLinks}>
                    <a
                      href="https://instagram.com/arcoiris.joyeria"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      Instagram
                    </a>
                    <a
                      href="https://facebook.com/arcoirisjoyeria"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.socialLink}
                    >
                      Facebook
                    </a>
                  </div>
                </motion.div>
              </motion.div>

              {/* Form */}
              <motion.div
                className={styles.formPanel}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                {sent ? (
                  <div className={styles.sentMessage}>
                    <div className={styles.sentIcon}>✓</div>
                    <h3 className={styles.sentTitle}>¡Mensaje enviado!</h3>
                    <p className={styles.sentText}>
                      Tu consulta fue redirigida a nuestro WhatsApp. Te responderemos lo antes posible.
                    </p>
                    <button
                      onClick={() => setSent(false)}
                      className={styles.sentBtn}
                    >
                      Enviar otro mensaje
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className={styles.form}>
                    <h3 className={styles.formTitle}>Envianos tu consulta</h3>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nombre *</label>
                      <input
                        type="text"
                        name="nombre"
                        value={form.nombre}
                        onChange={handleChange}
                        required
                        placeholder="Tu nombre completo"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        required
                        placeholder="nombre@email.com"
                        className={styles.input}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Asunto *</label>
                      <select
                        name="asunto"
                        value={form.asunto}
                        onChange={handleChange}
                        required
                        className={styles.input}
                      >
                        <option value="">Seleccionar...</option>
                        <option value="Consulta sobre producto">Consulta sobre producto</option>
                        <option value="Venta por mayor">Venta por mayor</option>
                        <option value="Pedido personalizado">Pedido personalizado</option>
                        <option value="Reclamo">Reclamo</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.label}>Mensaje *</label>
                      <textarea
                        name="mensaje"
                        value={form.mensaje}
                        onChange={handleChange}
                        required
                        placeholder="Escribí tu mensaje..."
                        className={styles.textarea}
                        rows={5}
                      />
                    </div>

                    <button type="submit" className={styles.submitBtn}>
                      Enviar Mensaje
                    </button>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
