import React, { useState, useEffect, useCallback } from "react";
import styles from "./HeroSlider.module.css";
import { useHeroSlides } from "../../../../hooks/useHeroSlides";
import { getServerImageUrl } from "../../../../config/api";

export interface Slide {
  id: number;
  _id?: string;
  image: string;
  title?: string;
  subtitle?: string;
  order?: number;
  isActive?: boolean;
}

interface HeroSliderProps {
  autoPlayInterval?: number;
}

// Slides por defecto - Arcoiris Joyería (solo se usan si no hay slides de la API)
const defaultSlides: Slide[] = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1515562141589-67f0d569b6c2?w=1600&h=900&fit=crop",
    title: "Bienvenido a Arcoiris",
    subtitle: "Joyería artesanal de autor",
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1600&h=900&fit=crop",
    title: "Colecciones Exclusivas",
    subtitle: "Diseños únicos que cuentan historias",
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1600&h=900&fit=crop",
    title: "Envíos a todo el país",
    subtitle: "Recibí tu joya en tu puerta",
  },
];

const HeroSlider: React.FC<HeroSliderProps> = ({ autoPlayInterval = 5000 }) => {
  // Cargar slides desde la API
  const { slides: apiSlides, loading } = useHeroSlides({ activeOnly: true });

  // Usar slides de la API si existen, sino usar los por defecto
  const slides: Slide[] =
    apiSlides.length > 0
      ? apiSlides.map((s, index) => ({
          id: index + 1,
          _id: s._id,
          image: s.image,
          title: s.title,
          subtitle: s.subtitle,
          order: s.order,
          isActive: s.isActive,
        }))
      : defaultSlides;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, slides.length, autoPlayInterval]);

  // Navegación manual
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
    // Pausar auto-play temporalmente al interactuar
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const goToPrevious = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [slides.length]);

  // Touch handlers para swipe en móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      goToNext();
    } else if (distance < -minSwipeDistance) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Mostrar loading solo si está cargando y no hay slides de fallback
  if (loading && apiSlides.length === 0) {
    return (
      <div className={styles.sliderContainer}>
        <div className={styles.slidesWrapper}>
          <div className={`${styles.slide} ${styles.active} ${styles.loading}`}>
            <div className={styles.slideOverlay} />
            <div className={styles.slideContent}>
              <h2 className={styles.slideTitle}>Cargando...</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={styles.sliderContainer}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      <div className={styles.slidesWrapper}>
        {slides.map((slide, index) => (
          <div
            key={slide._id || slide.id}
            className={`${styles.slide} ${index === currentSlide ? styles.active : ""}`}
            style={{
              backgroundImage: `url(${getServerImageUrl(slide.image)})`,
            }}
          >
            <div className={styles.slideOverlay} />
            {/* Solo mostrar contenido si hay título o subtítulo */}
            {(slide.title || slide.subtitle) && (
              <div className={styles.slideContent}>
                {slide.title && (
                  <h2 className={styles.slideTitle}>
                    {slide.title}
                    {slide.subtitle && (
                      <>
                        <br />
                        <span className={styles.slideSubtitle}>
                          {slide.subtitle}
                        </span>
                      </>
                    )}
                  </h2>
                )}
                {!slide.title && slide.subtitle && (
                  <h2 className={styles.slideTitle}>
                    <span className={styles.slideSubtitle}>
                      {slide.subtitle}
                    </span>
                  </h2>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Flechas de navegación */}
      {slides.length > 1 && (
        <>
          <button
            className={`${styles.navArrow} ${styles.prevArrow}`}
            onClick={goToPrevious}
            aria-label="Slide anterior"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            className={`${styles.navArrow} ${styles.nextArrow}`}
            onClick={goToNext}
            aria-label="Siguiente slide"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </>
      )}

      {/* Indicadores de puntos */}
      {slides.length > 1 && (
        <div className={styles.dotsContainer}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentSlide ? styles.activeDot : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
