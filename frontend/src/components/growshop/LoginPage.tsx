import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "./navigation/Navbar";
import Footer from "./layout/Footer";
import { apiClient } from "../../services/apiClient";
import { API_BASE_URL } from "../../config/api";
import styles from "./LoginPage.module.css";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (d: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: d, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface LoginForm {
  email: string;
  password: string;
}

interface JwtPayload {
  id: string;
  name: string;
  lastname: string;
  whatsapp: string;
  email: string;
  roles: Array<{
    _id: string;
    name: string;
    permissions: string[];
  }>;
}

/** Decode JWT payload without external library */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      if (!response.ok) {
        const msg = typeof data === "object" ? data.message : data;
        setError(msg || "Email o contraseña incorrectos");
        setIsSubmitting(false);
        return;
      }

      // The backend returns the JWT token directly as a string
      const token = typeof data === "string" ? data : data.token || data;
      const payload = decodeJwt(token);

      if (!payload) {
        setError("Error al procesar la respuesta del servidor");
        setIsSubmitting(false);
        return;
      }

      // Store token
      localStorage.setItem("authToken", token);
      apiClient.setAuthToken(token);

      // Store user data for Navbar and app consumption
      const isAdmin = payload.roles?.some(
        (r) =>
          r.name === "admin" || r.permissions?.includes("admin_granted")
      );

      const userData = {
        id: payload.id,
        name: payload.name,
        lastname: payload.lastname,
        email: payload.email,
        whatsapp: payload.whatsapp,
        isAdmin,
        roles: payload.roles,
      };
      localStorage.setItem("userData", JSON.stringify(userData));

      // Redirect based on role
      if (isAdmin) {
        navigate("/admin");
      } else {
        navigate("/shop");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("No se pudo conectar con el servidor. Intentá de nuevo.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.grid}>
            {/* Left — Info */}
            <motion.div
              className={styles.infoPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0}
            >
              <span className={styles.eyebrow}>Iniciar Sesión</span>
              <h1 className={styles.title}>
                Bienvenido a{" "}
                <span className={styles.accent}>Arcoiris</span>
              </h1>
              <p className={styles.description}>
                Ingresá con tu cuenta para acceder a la tienda, gestionar tus
                pedidos y disfrutar de una experiencia personalizada.
              </p>

              <div className={styles.infoCards}>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>🛍️</span>
                  <div>
                    <h4 className={styles.infoCardTitle}>Tu Tienda</h4>
                    <p className={styles.infoCardText}>
                      Navegá el catálogo completo y hacé tus pedidos de forma
                      rápida y segura.
                    </p>
                  </div>
                </div>
                <div className={styles.infoCard}>
                  <span className={styles.infoIcon}>⚙️</span>
                  <div>
                    <h4 className={styles.infoCardTitle}>Panel de Gestión</h4>
                    <p className={styles.infoCardText}>
                      Si sos administrador, accedé al panel para subir
                      productos, categorías y más.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Form */}
            <motion.div
              className={styles.formPanel}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={0.2}
            >
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formHeader}>
                  <h2 className={styles.formTitle}>Ingresá a tu cuenta</h2>
                </div>

                {error && (
                  <motion.div
                    className={styles.errorBox}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                  >
                    <span className={styles.errorIcon}>⚠️</span>
                    <p>{error}</p>
                  </motion.div>
                )}

                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="nombre@email.com"
                    className={styles.input}
                    autoComplete="email"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Contraseña</label>
                  <div className={styles.passwordWrapper}>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      required
                      placeholder="Tu contraseña"
                      className={styles.input}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? "◉" : "◎"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={styles.submitBtn}
                >
                  {isSubmitting ? (
                    <span className={styles.spinner} />
                  ) : (
                    "Iniciar Sesión"
                  )}
                </button>

                <p className={styles.registerLink}>
                  ¿No tenés cuenta?{" "}
                  <Link to="/registro" className={styles.registerLinkBtn}>
                    Crear Cuenta
                  </Link>
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

export default LoginPage;
