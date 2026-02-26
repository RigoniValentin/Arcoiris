import React, { useState, useEffect } from "react";
import styles from "./AgeVerification.module.css";
import logoImage from "../../../assets/Logos/Logo.png";

interface AgeVerificationProps {
  onVerified: () => void;
}

const AgeVerification: React.FC<AgeVerificationProps> = ({ onVerified }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Check if user has already verified their age in this session
    const hasVerified = sessionStorage.getItem("ageVerified");
    if (hasVerified === "true") {
      onVerified();
      return;
    }

    // Show the modal after a brief delay for smooth animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Show content after modal animation
      setTimeout(() => setShowContent(true), 300);
    }, 200);

    return () => clearTimeout(timer);
  }, [onVerified]);

  const handleAccept = () => {
    sessionStorage.setItem("ageVerified", "true");
    setIsVisible(false);
    setTimeout(() => {
      onVerified();
    }, 500);
  };

  const handleDecline = () => {
    // Redirect to an external site or close tab
    window.location.href = "https://www.google.com";
  };

  // Don't render anything if modal is not visible
  if (!isVisible && !showContent) return null;

  return (
    <div className={`${styles.overlay} ${isVisible ? styles.visible : ""}`}>
      <div className={styles.modal}>
        {/* Background effects */}
        <div className={styles.backgroundEffects}>
          <div className={styles.gradientOrb1}></div>
          <div className={styles.gradientOrb2}></div>
          <div className={styles.particles}>
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className={styles.particle}
                style={
                  {
                    "--delay": Math.random() * 15,
                    "--duration": 12 + Math.random() * 12,
                    "--start-x": Math.random() * 100,
                    "--start-y": Math.random() * 100,
                    "--end-x": Math.random() * 100,
                    "--end-y": Math.random() * 100,
                  } as React.CSSProperties
                }
              ></div>
            ))}
          </div>
        </div>

        {/* Modal content */}
        <div
          className={`${styles.content} ${showContent ? styles.contentVisible : ""}`}
        >
          {/* Logo */}
          <div className={styles.logoContainer}>
            <img src={logoImage} alt="Tricarios Logo" className={styles.logo} />
            <div className={styles.logoGlow}></div>
          </div>

          {/* Title */}
          <h2 className={styles.title}>
            Verificación de <span className={styles.highlight}>Edad</span>
          </h2>

          {/* Warning icon */}
          <div className={styles.warningIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="m12 17 .01 0" />
            </svg>
          </div>

          {/* Description */}
          <p className={styles.description}>
            Este sitio web contiene información sobre productos relacionados con
            el cultivo de cannabis. Para acceder, debes confirmar que eres mayor
            de 18 años.
          </p>

          {/* Legal notice */}
          <div className={styles.legalNotice}>
            <div className={styles.noticeIcon}>🌿</div>
            <p>
              El contenido de este sitio está destinado únicamente a personas
              mayores de edad y con fines educativos e informativos sobre el
              cultivo responsable.
            </p>
          </div>

          {/* Age confirmation question */}
          <div className={styles.question}>
            <h3>¿Eres mayor de 18 años?</h3>
          </div>

          {/* Action buttons */}
          <div className={styles.actions}>
            <button
              onClick={handleAccept}
              className={`${styles.button} ${styles.acceptButton}`}
            >
              <span className={styles.buttonIcon}>✓</span>
              <span>Sí, soy mayor de 18</span>
              <div className={styles.buttonGlow}></div>
            </button>
            <button
              onClick={handleDecline}
              className={`${styles.button} ${styles.declineButton}`}
            >
              <span className={styles.buttonIcon}>✕</span>
              <span>No, soy menor de 18</span>
            </button>
          </div>

          {/* Footer note */}
          <div className={styles.footer}>
            <p>
              Al continuar, confirmas que cumples con los requisitos de edad y
              aceptas navegar bajo tu propia responsabilidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgeVerification;
