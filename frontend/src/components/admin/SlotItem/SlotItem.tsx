import React, { useRef, useState, useCallback } from "react";
import { SlotItemProps } from "../../../types/imageSlots";
import styles from "./SlotItem.module.css";

export const SlotItem: React.FC<SlotItemProps> = ({
  slot,
  isLoading,
  onImageUpdate,
  onImageDelete,
  onDragStart,
  onDrop,
  canDelete,
  isDragOver = false,
  isDragging = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOverLocal, setIsDragOverLocal] = useState(false);

  // Manejar click para seleccionar archivo
  const handleImageClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Manejar cambio de archivo
  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        await onImageUpdate(file);
        // Limpiar input para permitir seleccionar el mismo archivo
        event.target.value = "";
      }
    },
    [onImageUpdate],
  );

  // Manejar eliminación
  const handleDelete = useCallback(
    async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (canDelete) {
        await onImageDelete();
      }
    },
    [onImageDelete, canDelete],
  );

  // Drag and Drop handlers
  const handleDragStart = useCallback(
    (event: React.DragEvent) => {
      if (!slot.isEmpty) {
        event.dataTransfer.effectAllowed = "move";
        onDragStart(slot.slot);
      } else {
        event.preventDefault();
      }
    },
    [slot.isEmpty, slot.slot, onDragStart],
  );

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setIsDragOverLocal(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOverLocal(false);
  }, []);

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setIsDragOverLocal(false);
      await onDrop(slot.slot);
    },
    [slot.slot, onDrop],
  );

  // Determinar clases CSS
  const slotClasses = [
    styles.slot,
    slot.isEmpty ? styles.empty : styles.occupied,
    slot.isPrimary ? styles.primary : "",
    isDragOver || isDragOverLocal ? styles.dragOver : "",
    isDragging ? styles.dragging : "",
    isLoading ? styles.loading : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={slotClasses}
      onClick={handleImageClick}
      draggable={!slot.isEmpty}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {/* Contenido del slot */}
      {slot.isEmpty ? (
        <div className={styles.emptyContent}>
          <div className={styles.uploadIcon}>📷</div>
          <div className={styles.uploadText}>
            Slot {slot.position}
            {slot.isPrimary && (
              <span className={styles.primaryBadge}>Principal</span>
            )}
          </div>
          <div className={styles.uploadHint}>Click para subir</div>
        </div>
      ) : (
        <div className={styles.imageContent}>
          <img
            src={slot.imageUrl!}
            alt={`Producto - Slot ${slot.position}`}
            className={styles.image}
          />

          {/* Overlay con controles */}
          <div className={styles.overlay}>
            <div className={styles.slotInfo}>
              <span className={styles.slotNumber}>{slot.position}</span>
              {slot.isPrimary && (
                <span className={styles.primaryBadge}>Principal</span>
              )}
            </div>

            <div className={styles.controls}>
              <button
                type="button"
                className={styles.replaceButton}
                onClick={handleImageClick}
                title="Reemplazar imagen"
              >
                🔄
              </button>

              {canDelete && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDelete}
                  title="Eliminar imagen"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {/* Indicador de arrastre */}
          <div className={styles.dragHandle}>⋮⋮</div>
        </div>
      )}

      {/* Indicador de carga */}
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Zona de drop visual */}
      {(isDragOver || isDragOverLocal) && (
        <div className={styles.dropZone}>
          <div className={styles.dropText}>Soltar aquí</div>
        </div>
      )}
    </div>
  );
};
