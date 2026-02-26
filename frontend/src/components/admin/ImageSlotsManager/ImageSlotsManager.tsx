import React, { useState, useCallback } from "react";
import { ImageSlotsManagerProps } from "../../../types/imageSlots";
import { useImageSlots } from "../../../hooks/useImageSlots";
import { SlotItem } from "../SlotItem/SlotItem";
import styles from "./ImageSlotsManager.module.css";

export const ImageSlotsManager: React.FC<ImageSlotsManagerProps> = ({
  productId,
  onImagesUpdate,
  onPrimaryImageChange,
  maxFileSize = 50 * 1024 * 1024, // 50MB por defecto
  acceptedFormats = ["jpeg", "png", "webp", "gif"],
}) => {
  const {
    slots,
    loading,
    error,
    summary,
    updateSlot,
    deleteSlot,
    reorderSlots,
    refreshSlots,
  } = useImageSlots(productId);

  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [operationLoading, setOperationLoading] = useState<number | null>(null);

  // Ahora que el backend está implementado, todas las operaciones están habilitadas

  // Manejar actualización de slot
  const handleSlotUpdate = useCallback(
    async (slotNumber: number, file: File) => {
      setOperationLoading(slotNumber);
      try {
        await updateSlot(slotNumber, file);

        // Refrescar y notificar cambios
        await refreshSlots();

        // Notificar actualización de imágenes si hay callback
        if (onImagesUpdate) {
          const gallery = slots
            .filter((slot) => !slot.isEmpty)
            .map((slot) => slot.imageUrl!);
          onImagesUpdate(gallery);
        }

        // Notificar cambio de imagen principal si hay callback
        if (onPrimaryImageChange) {
          const primarySlot = slots.find(
            (slot) => slot.isPrimary && !slot.isEmpty,
          );
          if (primarySlot) {
            onPrimaryImageChange(primarySlot.imageUrl!);
          }
        }
      } finally {
        setOperationLoading(null);
      }
    },
    [updateSlot, refreshSlots, slots, onImagesUpdate, onPrimaryImageChange],
  );

  // Manejar eliminación de slot
  const handleSlotDelete = useCallback(
    async (slotNumber: number) => {
      setOperationLoading(slotNumber);
      try {
        await deleteSlot(slotNumber);

        // Refrescar y notificar cambios
        await refreshSlots();

        // Notificar actualización de imágenes
        if (onImagesUpdate) {
          const gallery = slots
            .filter((slot) => !slot.isEmpty)
            .map((slot) => slot.imageUrl!);
          onImagesUpdate(gallery);
        }

        // Notificar cambio de imagen principal
        if (onPrimaryImageChange) {
          const primarySlot = slots.find(
            (slot) => slot.isPrimary && !slot.isEmpty,
          );
          if (primarySlot) {
            onPrimaryImageChange(primarySlot.imageUrl!);
          }
        }
      } finally {
        setOperationLoading(null);
      }
    },
    [deleteSlot, refreshSlots, slots, onImagesUpdate, onPrimaryImageChange],
  );

  // Manejar inicio de arrastre
  const handleDragStart = useCallback((slotNumber: number) => {
    setDraggedSlot(slotNumber);
  }, []);

  // Manejar drop
  const handleDrop = useCallback(
    async (toSlot: number) => {
      if (draggedSlot !== null && draggedSlot !== toSlot) {
        setOperationLoading(toSlot);
        try {
          await reorderSlots(draggedSlot, toSlot);

          // Refrescar y notificar cambios
          await refreshSlots();

          // Notificar actualización de imágenes
          if (onImagesUpdate) {
            const gallery = slots
              .filter((slot) => !slot.isEmpty)
              .map((slot) => slot.imageUrl!);
            onImagesUpdate(gallery);
          }

          // Notificar cambio de imagen principal
          if (onPrimaryImageChange) {
            const primarySlot = slots.find(
              (slot) => slot.isPrimary && !slot.isEmpty,
            );
            if (primarySlot) {
              onPrimaryImageChange(primarySlot.imageUrl!);
            }
          }
        } finally {
          setOperationLoading(null);
        }
      }
      setDraggedSlot(null);
    },
    [
      draggedSlot,
      reorderSlots,
      refreshSlots,
      slots,
      onImagesUpdate,
      onPrimaryImageChange,
    ],
  );

  // Determinar si se puede eliminar un slot
  const canDeleteSlot = useCallback(
    (slotNumber: number) => {
      const slot = slots.find((s) => s.slot === slotNumber);
      if (!slot || slot.isEmpty) return false;

      // No se puede eliminar si es la única imagen
      const occupiedSlots = slots.filter((s) => !s.isEmpty);
      return occupiedSlots.length > 1;
    },
    [slots],
  );

  // Manejar actualización masiva de imágenes (funcionalidad adicional)
  const handleBulkUpload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      const availableSlots = slots.filter((slot) => slot.isEmpty);
      const filesToProcess = files.slice(
        0,
        Math.min(files.length, availableSlots.length),
      );

      for (let i = 0; i < filesToProcess.length; i++) {
        const slot = availableSlots[i];
        await handleSlotUpdate(slot.slot, filesToProcess[i]);
      }
    },
    [slots, handleSlotUpdate],
  );

  return (
    <div className={styles.container}>
      {/* Header con información */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>Gestión de Imágenes</h3>
          <div className={styles.summary}>
            {summary.occupied} de {summary.total} slots ocupados
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.refreshButton}
            onClick={refreshSlots}
            disabled={loading}
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Información cuando no hay imágenes */}
      {!loading && !error && summary.occupied === 0 && (
        <div className={styles.backendInfo}>
          <div className={styles.infoIcon}>�</div>
          <div className={styles.infoContent}>
            <strong>Sistema de Slots - Listo para usar</strong>
            <p>
              Este producto no tiene imágenes asignadas aún. Puedes subir hasta
              6 imágenes usando el sistema de slots individual.
            </p>
            <p>
              <strong>Cómo usar:</strong> Haz click en cualquier slot vacío para
              subir una imagen, o arrastra archivos desde tu computadora.
            </p>
            <details style={{ marginTop: "12px" }}>
              <summary
                style={{
                  cursor: "pointer",
                  color: "#92400e",
                  fontWeight: "600",
                }}
              >
                � Características del sistema
              </summary>
              <p style={{ marginTop: "8px", fontSize: "13px" }}>
                • 6 slots individuales para máximo control
                <br />
                • Drag & drop para reordenar imágenes
                <br />
                • Slot 1 siempre es la imagen principal
                <br />
                • Formatos: JPEG, PNG, WebP, GIF (máx. 50MB)
                <br />• Operaciones granulares: actualizar, eliminar, reemplazar
              </p>
            </details>
          </div>
        </div>
      )}

      {/* Grid de slots */}
      <div className={styles.slotsGrid}>
        {slots.map((slot) => (
          <SlotItem
            key={slot.slot}
            slot={slot}
            isLoading={loading || operationLoading === slot.slot}
            onImageUpdate={(file) => handleSlotUpdate(slot.slot, file)}
            onImageDelete={() => handleSlotDelete(slot.slot)}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
            canDelete={canDeleteSlot(slot.slot)}
            isDragOver={draggedSlot !== null && draggedSlot !== slot.slot}
            isDragging={draggedSlot === slot.slot}
          />
        ))}
      </div>

      {/* Información adicional */}
      <div className={styles.info}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>📱 Formato:</span>
          <span className={styles.infoValue}>
            {acceptedFormats.map((f) => f.toUpperCase()).join(", ")}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>📏 Tamaño máximo:</span>
          <span className={styles.infoValue}>
            {Math.round(maxFileSize / 1024 / 1024)}MB
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>🔴 Imagen principal:</span>
          <span className={styles.infoValue}>Slot 1 (marca roja)</span>
        </div>
      </div>

      {/* Funcionalidad de upload masivo (oculta, para desarrollo futuro) */}
      <input
        type="file"
        multiple
        accept="image/*"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          if (files.length > 0) {
            handleBulkUpload(files);
          }
          e.target.value = "";
        }}
        style={{ display: "none" }}
        id={`bulk-upload-${productId}`}
      />
    </div>
  );
};
