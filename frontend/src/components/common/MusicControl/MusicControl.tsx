import React, { useState, useEffect, useRef } from "react";
import _musicFile from "../../../assets/MusicaFondo/MusicaFondo.mp3";
import styles from "./MusicControl.module.css";

const MusicControl: React.FC = () => {
  // Simular propiedades de control de música para evitar errores de TypeScript
  const isPlaying = false;
  const volume = 0.3;
  const togglePlayPause = () => {};
  const setVolume = (_vol: number) => {};
  const isLoaded = false;
  const hasPlayed = false;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);
  const autoCollapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768 || "ontouchstart" in window);
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  // Auto-colapsar después de 3 segundos de inactividad en móviles
  useEffect(() => {
    if (isMobile && isExpanded) {
      // Limpiar timeout anterior
      if (autoCollapseTimeoutRef.current) {
        clearTimeout(autoCollapseTimeoutRef.current);
      }

      // Establecer nuevo timeout
      autoCollapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000); // 3 segundos
    }

    return () => {
      if (autoCollapseTimeoutRef.current) {
        clearTimeout(autoCollapseTimeoutRef.current);
      }
    };
  }, [isMobile, isExpanded]);

  // Detectar clicks fuera del control para colapsarlo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        isMobile &&
        isExpanded &&
        controlRef.current &&
        !controlRef.current.contains(event.target as Node)
      ) {
        setIsExpanded(false);
      }
    };

    if (isMobile && isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isMobile, isExpanded]);

  const handleControlClick = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  if (!isLoaded) {
    return null; // No mostrar el control si la música no está cargada
  }

  return (
    <div
      ref={controlRef}
      className={`${styles.musicControl} ${isMobile && isExpanded ? styles.expanded : ""} ${isPlaying ? styles.playing : ""}`}
      onClick={isMobile ? handleControlClick : undefined}
      title={isMobile ? "Tocar para controlar música" : ""}
    >
      <div className={styles.controlPanel}>
        {/* Icono de música que aparece cuando está colapsado */}
        <div className={styles.musicIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
          </svg>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlayPause();
          }}
          className={styles.playButton}
          aria-label={
            isPlaying
              ? "Pausar música"
              : hasPlayed
                ? "Reproducir música (ya se reprodujo una vez)"
                : "Reproducir música"
          }
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div className={styles.volumeContainer}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="currentColor"
            className={styles.volumeIcon}
          >
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
            aria-label="Control de volumen"
          />
        </div>
      </div>
    </div>
  );
};

export default MusicControl;
