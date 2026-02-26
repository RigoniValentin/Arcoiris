import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import styles from "./RegisterPage.module.css";

type BuyerType = "minorista" | "mayorista";

interface RegisterForm {
  nombre: string;
  apellido: string;
  email: string;
  whatsapp: string;
  ubicacion: string;
  emprendimiento: string;
  tipoComprador: BuyerType;
  mensaje: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    nombre: "",
    apellido: "",
    email: "",
    whatsapp: "",
    ubicacion: "",
    emprendimiento: "",
    tipoComprador: "minorista",
    mensaje: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Build WhatsApp message for contact
    const buyerLabel = form.tipoComprador === "mayorista" ? "MAYORISTA" : "MINORISTA";
    const message = [
      `🔷 *NUEVA SOLICITUD DE REGISTRO*`,
      ``,
      `👤 *Nombre:* ${form.nombre} ${form.apellido}`,
      `📧 *Email:* ${form.email}`,
      `📱 *WhatsApp:* ${form.whatsapp}`,
      `📍 *Ubicación:* ${form.ubicacion}`,
      form.emprendimiento ? `🏪 *Emprendimiento:* ${form.emprendimiento}` : "",
      `🏷️ *Tipo:* ${buyerLabel}`,
      form.mensaje ? `💬 *Mensaje:* ${form.mensaje}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // If mayorista, redirect to WhatsApp for admin contact
    if (form.tipoComprador === "mayorista") {
      const encoded = encodeURIComponent(message);
      window.open(`https://wa.me/5493584192268?text=${encoded}`, "_blank");
    }

    // Simulate save
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);

      // Save basic user data to localStorage
      const userData = {
        id: Date.now().toString(),
        name: form.nombre,
        lastname: form.apellido,
        email: form.email,
        whatsapp: form.whatsapp,
        location: form.ubicacion,
        business: form.emprendimiento,
        buyerType: form.tipoComprador,
        isAdmin: false,
      };
      localStorage.setItem("userData", JSON.stringify(userData));
    }, 1200);
  };

  if (submitted) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={styles.main}>
          <motion.div
            className={styles.successContainer}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className={styles.successIcon}>◇</div>
            <h2 className={styles.successTitle}>¡Registro exitoso!</h2>
            <p className={styles.successText}>
              {form.tipoComprador === "mayorista"
                ? "Tu solicitud de cuenta mayorista fue enviada. Nuestro equipo se contactará con vos a la brevedad."
                : "Tu cuenta fue creada correctamente. Ya podés explorar nuestra tienda."}
            </p>
            <div className={styles.successActions}>
              <Link to="/shop" className={styles.successBtn}>
                Ir a la Tienda
              </Link>
              <Link to="/" className={styles.successSecondary}>
                Volver al Inicio
              </Link>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Left - Info */}
            <motion.div
              className={styles.infoPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <span className={styles.eyebrow}>Crear Cuenta</span>
              <h1 className={styles.title}>
                Unite a la comunidad <span className={styles.accent}>Arcoiris</span>
              </h1>
              <p className={styles.description}>
                Creá tu cuenta para acceder a nuestro catálogo completo, recibir
                novedades exclusivas y realizar tus pedidos de forma rápida.
              </p>

              <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>🛍️</span>
                  <div>
                    <h4 className={styles.infoCardTitle}>Compra Minorista</h4>
                    <p className={styles.infoCardText}>
                      Accedé al catálogo completo con precios minoristas y realizá
                      tus pedidos directamente.
                    </p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>💎</span>
                  <div>
                    <h4 className={styles.infoCardTitle}>Compra Mayorista</h4>
                    <p className={styles.infoCardText}>
                      Precios diferenciados para emprendedores y revendedores.
                      Requiere aprobación del equipo.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right - Form */}
            <motion.div
              className={styles.formPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.2}
            >
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Buyer type selector */}
                <div className={styles.buyerTypeSelector}>
                  <button
                    type="button"
                    className={`${styles.buyerTypeBtn} ${form.tipoComprador === "minorista" ? styles.buyerActive : ""}`}
                    onClick={() => setForm((p) => ({ ...p, tipoComprador: "minorista" }))}
                  >
                    Minorista
                  </button>
                  <button
                    type="button"
                    className={`${styles.buyerTypeBtn} ${form.tipoComprador === "mayorista" ? styles.buyerActive : ""}`}
                    onClick={() => setForm((p) => ({ ...p, tipoComprador: "mayorista" }))}
                  >
                    Mayorista
                  </button>
                </div>

                {form.tipoComprador === "mayorista" && (
                  <motion.div
                    className={styles.wholesaleNotice}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <p>
                      Las cuentas mayoristas requieren aprobación. Al enviar el
                      formulario serás redirigido a WhatsApp para contactar con
                      nuestro equipo.
                    </p>
                  </motion.div>
                )}

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      required
                      placeholder="Tu nombre"
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Apellido *</label>
                    <input
                      type="text"
                      name="apellido"
                      value={form.apellido}
                      onChange={handleChange}
                      required
                      placeholder="Tu apellido"
                      className={styles.input}
                    />
                  </div>
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

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>WhatsApp / Contacto *</label>
                    <input
                      type="tel"
                      name="whatsapp"
                      value={form.whatsapp}
                      onChange={handleChange}
                      required
                      placeholder="+54 9 ..."
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>¿De dónde sos? *</label>
                    <input
                      type="text"
                      name="ubicacion"
                      value={form.ubicacion}
                      onChange={handleChange}
                      required
                      placeholder="Ciudad, Provincia"
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Nombre del Emprendimiento
                    {form.tipoComprador === "mayorista" && " *"}
                  </label>
                  <input
                    type="text"
                    name="emprendimiento"
                    value={form.emprendimiento}
                    onChange={handleChange}
                    required={form.tipoComprador === "mayorista"}
                    placeholder="Nombre de tu negocio o emprendimiento"
                    className={styles.input}
                  />
                </div>

                {form.tipoComprador === "mayorista" && (
                  <motion.div
                    className={styles.formGroup}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <label className={styles.label}>Mensaje (opcional)</label>
                    <textarea
                      name="mensaje"
                      value={form.mensaje}
                      onChange={handleChange}
                      placeholder="Contanos sobre tu emprendimiento, qué productos te interesan, etc."
                      className={styles.textarea}
                      rows={3}
                    />
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <span className={styles.spinner} />
                  ) : form.tipoComprador === "mayorista" ? (
                    "Solicitar Cuenta Mayorista"
                  ) : (
                    "Crear Cuenta"
                  )}
                </button>

                <p className={styles.loginLink}>
                  ¿Ya tenés cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/shop")}
                    className={styles.loginBtn}
                  >
                    Ir a la tienda
                  </button>
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RegisterPage;
