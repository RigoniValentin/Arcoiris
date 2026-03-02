import React, { useState, useCallback, useRef, useMemo } from "react";
import styles from "./LocalSlotsPreview.module.css";

interface LocalSlot {
  slot: number;
  position: number;
  file: File | null;
  previewUrl: string | null;
  isEmpty: boolean;
  isPrimary: boolean;
}

interface LocalSlotsPreviewProps {
  onFilesChange: (files: Map<number, File>) => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
}

export const LocalSlotsPreview: React.FC<LocalSlotsPreviewProps> = ({
  onFilesChange,
  maxFileSize = 50 * 1024 * 1024,
  acceptedFormats = ["jpeg", "png", "webp", "gif"],
}) => {
  const [slots, setSlots] = useState<LocalSlot[]>(() =>
    Array.from({ length: 6 }, (_, index) => ({
      slot: index,
      position: index + 1,
      file: null,
      previewUrl: null,
      isEmpty: true,
      isPrimary: index === 0,
    })),
  );

  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const summary = useMemo(() => {
    const occupied = slots.filter((s) => !s.isEmpty).length;
    return { total: 6, occupied, empty: 6 - occupied };
  }, [slots]);

  // Validar archivo
  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxFileSize) {
        return `El archivo no debe superar los ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      }
      const validTypes = acceptedFormats.map((f) => `image/${f}`);
      if (!validTypes.includes(file.type)) {
        return `Formato no válido. Use ${acceptedFormats.map((f) => f.toUpperCase()).join(", ")}`;
      }
      return null;
    },
    [maxFileSize, acceptedFormats],
  );

  // Notificar cambios al padre
  const notifyChanges = useCallback(
    (updatedSlots: LocalSlot[]) => {
      const filesMap = new Map<number, File>();
      updatedSlots.forEach((slot) => {
        if (slot.file) {
          filesMap.set(slot.slot, slot.file);
        }
      });
      onFilesChange(filesMap);
    },
    [onFilesChange],
  );

  // Agregar imagen a un slot
  const handleFileSelect = useCallback(
    (slotNumber: number, file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      const previewUrl = URL.createObjectURL(file);

      setSlots((prev) => {
        const updated = prev.map((s) =>
          s.slot === slotNumber
            ? { ...s, file, previewUrl, isEmpty: false }
            : s,
        );
        // Revocar URL anterior si existía
        const oldSlot = prev.find((s) => s.slot === slotNumber);
        if (oldSlot?.previewUrl) {
          URL.revokeObjectURL(oldSlot.previewUrl);
        }
        notifyChanges(updated);
        return updated;
      });
    },
    [validateFile, notifyChanges],
  );

  // Eliminar imagen de un slot
  const handleDelete = useCallback(
    (slotNumber: number) => {
      setSlots((prev) => {
        const slot = prev.find((s) => s.slot === slotNumber);
        if (slot?.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
        const updated = prev.map((s) =>
          s.slot === slotNumber
            ? { ...s, file: null, previewUrl: null, isEmpty: true }
            : s,
        );
        notifyChanges(updated);
        return updated;
      });
    },
    [notifyChanges],
  );

  // Drag & Drop entre slots
  const handleDragStart = useCallback((slotNumber: number) => {
    setDraggedSlot(slotNumber);
  }, []);

  const handleDrop = useCallback(
    (toSlot: number) => {
      if (draggedSlot === null || draggedSlot === toSlot) {
        setDraggedSlot(null);
        return;
      }

      setSlots((prev) => {
        const fromSlotData = prev.find((s) => s.slot === draggedSlot)!;
        const toSlotData = prev.find((s) => s.slot === toSlot)!;

        const updated = prev.map((s) => {
          if (s.slot === draggedSlot) {
            return {
              ...s,
              file: toSlotData.file,
              previewUrl: toSlotData.previewUrl,
              isEmpty: toSlotData.isEmpty,
            };
          }
          if (s.slot === toSlot) {
            return {
              ...s,
              file: fromSlotData.file,
              previewUrl: fromSlotData.previewUrl,
              isEmpty: fromSlotData.isEmpty,
            };
          }
          return s;
        });

        notifyChanges(updated);
        return updated;
      });

      setDraggedSlot(null);
    },
    [draggedSlot, notifyChanges],
  );

  // Limpiar error después de 5 segundos
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Cleanup de URLs al desmontar
  React.useEffect(() => {
    return () => {
      slots.forEach((slot) => {
        if (slot.previewUrl) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>Gestión de Imágenes</h3>
          <div className={styles.summary}>
            {summary.occupied} de {summary.total} slots asignados
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={styles.error}>
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Info */}
      {summary.occupied === 0 && (
        <div className={styles.info}>
          <div className={styles.infoIcon}>📷</div>
          <div className={styles.infoContent}>
            <strong>Selecciona imágenes para tu producto</strong>
            <p>
              Haz click en cualquier slot para agregar una imagen. Puedes
              agregar hasta 6 imágenes. El Slot 1 será la imagen principal del
              producto.
            </p>
          </div>
        </div>
      )}

      {/* Grid de slots */}
      <div className={styles.slotsGrid}>
        {slots.map((slot) => (
          <LocalSlotItem
            key={slot.slot}
            slot={slot}
            onFileSelect={(file) => handleFileSelect(slot.slot, file)}
            onDelete={() => handleDelete(slot.slot)}
            onDragStart={() => handleDragStart(slot.slot)}
            onDrop={() => handleDrop(slot.slot)}
            canDelete={!slot.isEmpty}
            isDragOver={draggedSlot !== null && draggedSlot !== slot.slot}
            isDragging={draggedSlot === slot.slot}
            fileInputRef={(el) => {
              fileInputRefs.current[slot.slot] = el;
            }}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className={styles.footer}>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>📱 Formato:</span>
          <span className={styles.footerValue}>
            {acceptedFormats.map((f) => f.toUpperCase()).join(", ")}
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>📏 Tamaño máximo:</span>
          <span className={styles.footerValue}>
            {Math.round(maxFileSize / 1024 / 1024)}MB
          </span>
        </div>
        <div className={styles.footerItem}>
          <span className={styles.footerLabel}>🔴 Imagen principal:</span>
          <span className={styles.footerValue}>Slot 1 (marca roja)</span>
        </div>
      </div>
    </div>
  );
};

// Componente interno para cada slot local
interface LocalSlotItemProps {
  slot: LocalSlot;
  onFileSelect: (file: File) => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDrop: () => void;
  canDelete: boolean;
  isDragOver: boolean;
  isDragging: boolean;
  fileInputRef: (el: HTMLInputElement | null) => void;
}

const LocalSlotItem: React.FC<LocalSlotItemProps> = ({
  slot,
  onFileSelect,
  onDelete,
  onDragStart,
  onDrop,
  canDelete,
  isDragOver,
  isDragging,
  fileInputRef,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOverLocal, setIsDragOverLocal] = useState(false);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onFileSelect(file);
        e.target.value = "";
      }
    },
    [onFileSelect],
  );

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete();
    },
    [onDelete],
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!slot.isEmpty) {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      } else {
        e.preventDefault();
      }
    },
    [slot.isEmpty, onDragStart],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setIsDragOverLocal(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOverLocal(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverLocal(false);
      onDrop();
    },
    [onDrop],
  );

  const slotClasses = [
    styles.slot,
    slot.isEmpty ? styles.empty : styles.occupied,
    slot.isPrimary ? styles.primary : "",
    isDragOver || isDragOverLocal ? styles.dragOver : "",
    isDragging ? styles.dragging : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={slotClasses}
      onClick={handleClick}
      draggable={!slot.isEmpty}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={(el) => {
          inputRef.current = el;
          fileInputRef(el);
        }}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {slot.isEmpty ? (
        <div className={styles.emptyContent}>
          <div className={styles.uploadIcon}>📷</div>
          <div className={styles.uploadText}>
            Slot {slot.position}
            {slot.isPrimary && (
              <span className={styles.primaryBadge}>Principal</span>
            )}
          </div>
          <div className={styles.uploadHint}>Click para seleccionar</div>
        </div>
      ) : (
        <div className={styles.imageContent}>
          <img
            src={slot.previewUrl!}
            alt={`Preview - Slot ${slot.position}`}
            className={styles.image}
          />

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
                onClick={handleClick}
                title="Reemplazar imagen"
              >
                🔄
              </button>

              {canDelete && (
                <button
                  type="button"
                  className={styles.deleteButton}
                  onClick={handleDeleteClick}
                  title="Eliminar imagen"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          <div className={styles.dragHandle}>⋮⋮</div>
        </div>
      )}

      {(isDragOver || isDragOverLocal) && (
        <div className={styles.dropZone}>
          <div className={styles.dropText}>Soltar aquí</div>
        </div>
      )}
    </div>
  );
};
