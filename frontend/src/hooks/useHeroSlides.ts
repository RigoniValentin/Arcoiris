import { useState, useEffect, useCallback } from "react";
import {
  heroSlideService,
  HeroSlide,
  HeroSlideFormData,
} from "../services/heroSlideService";

interface UseHeroSlidesOptions {
  activeOnly?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseHeroSlidesReturn {
  slides: HeroSlide[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createSlide: (slideData: HeroSlideFormData) => Promise<HeroSlide>;
  updateSlide: (id: string, slideData: HeroSlideFormData) => Promise<HeroSlide>;
  deleteSlide: (id: string) => Promise<void>;
  updateMultipleSlides: (slides: Partial<HeroSlide>[]) => Promise<void>;
}

export const useHeroSlides = (
  options: UseHeroSlidesOptions = {},
): UseHeroSlidesReturn => {
  const {
    activeOnly = true,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSlides = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = activeOnly
        ? await heroSlideService.getActiveSlides()
        : await heroSlideService.getAllSlides();
      setSlides(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar slides");
      console.error("Error fetching hero slides:", err);
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchSlides();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchSlides, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchSlides, autoRefresh, refreshInterval]);

  const createSlide = useCallback(
    async (slideData: HeroSlideFormData) => {
      const newSlide = await heroSlideService.createSlide(slideData);
      await fetchSlides();
      return newSlide;
    },
    [fetchSlides],
  );

  const updateSlide = useCallback(
    async (id: string, slideData: HeroSlideFormData) => {
      const updatedSlide = await heroSlideService.updateSlide(id, slideData);
      await fetchSlides();
      return updatedSlide;
    },
    [fetchSlides],
  );

  const deleteSlide = useCallback(
    async (id: string) => {
      await heroSlideService.deleteSlide(id);
      await fetchSlides();
    },
    [fetchSlides],
  );

  const updateMultipleSlides = useCallback(
    async (slidesData: Partial<HeroSlide>[]) => {
      await heroSlideService.updateMultipleSlides(slidesData);
      await fetchSlides();
    },
    [fetchSlides],
  );

  return {
    slides,
    loading,
    error,
    refresh: fetchSlides,
    createSlide,
    updateSlide,
    deleteSlide,
    updateMultipleSlides,
  };
};
