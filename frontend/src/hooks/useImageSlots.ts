import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  ImageSlot,
  UseImageSlotsReturn,
  FileValidationResult,
} from "../types/imageSlots";
import { imageSlotsService } from "../services/imageSlotsService";
import { getFullImageUrl } from "../utils/imageUtils";

export const useImageSlots = (productId: string): UseImageSlotsReturn => {
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const warnedProductIds = useRef<Set<string>>(new Set());

  // Función para procesar slots del servidor y convertir URLs
  const processSlots = useCallback((serverSlots: ImageSlot[]): ImageSlot[] => {
    return serverSlots.map((slot) => ({
      ...slot,
      imageUrl: slot.imageUrl ? getFullImageUrl(slot.imageUrl) : null,
    }));
  }, []);

  // Inicializar slots vacíos
  const initializeEmptySlots = useCallback((): ImageSlot[] => {
    return Array.from({ length: 6 }, (_, index) => ({
      slot: index,
      position: index + 1,
      imageUrl: null,
      isEmpty: true,
      isPrimary: index === 0,
    }));
  }, []);

  // Calcular resumen
  const summary = useMemo(() => {
    const occupied = slots.filter((slot) => !slot.isEmpty).length;
    return {
      total: 6,
      occupied,
      empty: 6 - occupied,
    };
  }, [slots]);

  // Validar archivo
  const validateFile = useCallback((file: File): FileValidationResult => {
    const errors: string[] = [];

    // Tamaño máximo 50MB
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push("El archivo no debe superar los 50MB");
    }

    // Formatos aceptados
    const acceptedFormats = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!acceptedFormats.includes(file.type)) {
      errors.push("Formato no válido. Use JPEG, PNG, WebP o GIF");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, []);

  // Cargar slots del producto
  const loadSlots = useCallback(async () => {
    if (!productId || loading) return; // Evitar llamadas múltiples

    setLoading(true);
    setError(null);

    try {
      const response = await imageSlotsService.getSlots(productId);

      if (response.success) {
        // Procesar slots para convertir URLs relativas a completas
        const processedSlots = processSlots(response.data.slots);
        setSlots(processedSlots);
      } else {
        // Si no hay slots, inicializar vacíos
        setSlots(initializeEmptySlots());
      }
    } catch (err) {
      // Manejar diferentes tipos de errores
      const error = err as Error;

      if (
        error.message === "ENDPOINT_NOT_IMPLEMENTED" ||
        error.message === "INVALID_RESPONSE_FORMAT"
      ) {
        // Endpoints antiguos o problemas de formato de respuesta
        // Solo mostrar warning una vez por productId
        if (!warnedProductIds.current.has(productId)) {
          console.warn(
            `Slots endpoint legacy format for product ${productId}, using empty slots`,
          );
          warnedProductIds.current.add(productId);
        }
        setSlots(initializeEmptySlots());
        // No mostrar error al usuario
      } else {
        // Error real del servidor (conexión, server down, etc.)
        setError("Error al conectar con el servidor");
        console.error("Error loading slots:", err);
        setSlots(initializeEmptySlots());
      }
    } finally {
      setLoading(false);
    }
  }, [productId, initializeEmptySlots, processSlots]);

  // Actualizar slot con nueva imagen
  const updateSlot = useCallback(
    async (slotNumber: number, file: File) => {
      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.errors.join(", "));
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await imageSlotsService.updateSlot(
          productId,
          slotNumber,
          file,
        );

        if (response.success) {
          // Procesar slots para convertir URLs relativas a completas
          const processedSlots = processSlots(response.data.slots);
          setSlots(processedSlots);

          // Notificar actualización de galería y imagen principal
          if (response.data.gallery) {
            // Aquí podrías emitir eventos o callbacks si necesitas notificar a componentes padre
            console.log("Gallery updated:", response.data.gallery);
          }
        } else {
          setError("Error al actualizar la imagen");
        }
      } catch (err) {
        setError("Error al subir la imagen");
        console.error("Error updating slot:", err);
      } finally {
        setLoading(false);
      }
    },
    [productId, validateFile, processSlots],
  );

  // Eliminar imagen de slot
  const deleteSlot = useCallback(
    async (slotNumber: number) => {
      // Verificar que no sea la última imagen
      const occupiedSlots = slots.filter((slot) => !slot.isEmpty);
      if (occupiedSlots.length <= 1) {
        setError("No se puede eliminar la última imagen del producto");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await imageSlotsService.deleteSlot(
          productId,
          slotNumber,
        );

        if (response.success) {
          // Procesar slots para convertir URLs relativas a completas
          const processedSlots = processSlots(response.data.slots);
          setSlots(processedSlots);
        } else {
          setError("Error al eliminar la imagen");
        }
      } catch (err) {
        setError("Error al eliminar la imagen");
        console.error("Error deleting slot:", err);
      } finally {
        setLoading(false);
      }
    },
    [productId, slots, processSlots],
  );

  // Reordenar slots
  const reorderSlots = useCallback(
    async (fromSlot: number, toSlot: number) => {
      if (fromSlot === toSlot) return;

      setLoading(true);
      setError(null);

      try {
        const response = await imageSlotsService.reorderSlots(
          productId,
          fromSlot,
          toSlot,
        );

        if (response.success) {
          // Procesar slots para convertir URLs relativas a completas
          const processedSlots = processSlots(response.data.slots);
          setSlots(processedSlots);
        } else {
          setError("Error al reordenar las imágenes");
        }
      } catch (err) {
        setError("Error al reordenar las imágenes");
        console.error("Error reordering slots:", err);
      } finally {
        setLoading(false);
      }
    },
    [productId, processSlots],
  );

  // Refrescar slots
  const refreshSlots = useCallback(async () => {
    await loadSlots();
  }, [loadSlots]);

  // Cargar slots cuando cambie el productId
  useEffect(() => {
    if (productId) {
      loadSlots();
    }
  }, [productId]); // Solo depender de productId, no de loadSlots

  // Limpiar error después de 5 segundos
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return {
    slots,
    loading,
    error,
    summary,
    updateSlot,
    deleteSlot,
    reorderSlots,
    refreshSlots,
  };
};
