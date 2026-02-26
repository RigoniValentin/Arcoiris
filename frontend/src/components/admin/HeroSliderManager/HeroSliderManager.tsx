import React, { useState, useCallback, useRef } from "react";
import { useHeroSlides } from "../../../hooks/useHeroSlides";
import { HeroSlide } from "../../../services/heroSlideService";
import {
  compressHeroSlideImage,
  formatFileSize,
  isValidImageFile,
  getImagePreviewUrl,
  CompressionResult,
} from "../../../utils/imageCompression";
import { getServerImageUrl } from "../../../config/api";
import styles from "./HeroSliderManager.module.css";

interface HeroSliderManagerProps {
  onClose?: () => void;
}

interface FormDataState {
  title: string;
  subtitle: string;
  image: string | File;
  imagePreview: string;
  isActive: boolean;
}

interface CompressionInfo {
  originalSize: string;
  compressedSize: string;
  compressionRatio: number;
}

export const HeroSliderManager: React.FC<HeroSliderManagerProps> = ({
  onClose,
}) => {
  const {
    slides,
    loading,
    error,
    refresh,
    createSlide,
    updateSlide,
    deleteSlide,
    updateMultipleSlides,
  } = useHeroSlides({ activeOnly: false });

  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionInfo, setCompressionInfo] =
    useState<CompressionInfo | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<FormDataState>({
    title: "",
    subtitle: "",
    image: "",
    imagePreview: "",
    isActive: true,
  });

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      subtitle: "",
      image: "",
      imagePreview: "",
      isActive: true,
    });
    setEditingSlide(null);
    setIsCreating(false);
    setCompressionInfo(null);
  }, []);

  // Procesar archivo de imagen con compresión
  const handleImageFile = useCallback(async (file: File) => {
    if (!isValidImageFile(file)) {
      alert("Por favor selecciona una imagen válida (JPG, PNG, WEBP, GIF)");
      return;
    }

    setIsCompressing(true);
    setCompressionInfo(null);

    try {
      // Comprimir imagen
      const result: CompressionResult = await compressHeroSlideImage(file);

      // Obtener preview de la imagen comprimida
      const compressedPreview = await getImagePreviewUrl(result.file);

      setFormData((prev) => ({
        ...prev,
        image: result.file,
        imagePreview: compressedPreview,
      }));

      setCompressionInfo({
        originalSize: formatFileSize(result.originalSize),
        compressedSize: formatFileSize(result.compressedSize),
        compressionRatio: result.compressionRatio,
      });
    } catch (err) {
      console.error("Error al comprimir imagen:", err);
      alert("Error al procesar la imagen. Por favor intenta con otra.");
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // Manejar drop de archivos
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFile(e.dataTransfer.files[0]);
      }
    },
    [handleImageFile],
  );

  // Manejar drag over
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  // Manejar drag leave
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  // Manejar selección de archivo
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFile(e.target.files[0]);
      }
    },
    [handleImageFile],
  );

  // Abrir selector de archivos
  const openFileSelector = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Limpiar imagen seleccionada
  const clearImage = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      image: "",
      imagePreview: "",
    }));
    setCompressionInfo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  // Iniciar edición
  const handleEdit = useCallback((slide: HeroSlide) => {
    setEditingSlide(slide);
    setFormData({
      title: slide.title || "",
      subtitle: slide.subtitle || "",
      image: slide.image,
      imagePreview: getServerImageUrl(slide.image),
      isActive: slide.isActive,
    });
    setIsCreating(false);
    setCompressionInfo(null);
  }, []);

  // Iniciar creación
  const handleCreate = useCallback(() => {
    resetForm();
    setIsCreating(true);
  }, [resetForm]);

  // Guardar slide (crear o actualizar)
  const handleSave = useCallback(async () => {
    // Solo la imagen es requerida ahora
    if (!formData.image) {
      alert("La imagen es requerida");
      return;
    }

    setOperationLoading(true);
    try {
      if (editingSlide && editingSlide._id) {
        await updateSlide(editingSlide._id, {
          title: formData.title || undefined,
          subtitle: formData.subtitle || undefined,
          image: formData.image,
          isActive: formData.isActive,
        });
      } else if (isCreating) {
        await createSlide({
          title: formData.title || undefined,
          subtitle: formData.subtitle || undefined,
          image: formData.image,
          order: slides.length,
          isActive: formData.isActive,
        });
      }
      resetForm();
    } catch (err) {
      alert("Error al guardar el slide");
      console.error(err);
    } finally {
      setOperationLoading(false);
    }
  }, [
    formData,
    editingSlide,
    isCreating,
    updateSlide,
    createSlide,
    slides.length,
    resetForm,
  ]);

  // Eliminar slide
  const handleDelete = useCallback(
    async (slide: HeroSlide) => {
      if (!slide._id) return;

      const slideIdentifier =
        slide.title ||
        `Slide #${slides.findIndex((s) => s._id === slide._id) + 1}`;
      if (
        !window.confirm(
          `¿Estás seguro de eliminar el slide "${slideIdentifier}"?`,
        )
      ) {
        return;
      }

      setOperationLoading(true);
      try {
        await deleteSlide(slide._id);
      } catch (err) {
        alert("Error al eliminar el slide");
        console.error(err);
      } finally {
        setOperationLoading(false);
      }
    },
    [deleteSlide],
  );

  // Toggle activo/inactivo
  const handleToggleActive = useCallback(
    async (slide: HeroSlide) => {
      if (!slide._id) return;

      setOperationLoading(true);
      try {
        await updateSlide(slide._id, {
          isActive: !slide.isActive,
        });
      } catch (err) {
        alert("Error al cambiar el estado del slide");
        console.error(err);
      } finally {
        setOperationLoading(false);
      }
    },
    [updateSlide],
  );

  // Mover slide arriba/abajo
  const handleMove = useCallback(
    async (slideIndex: number, direction: "up" | "down") => {
      const newIndex = direction === "up" ? slideIndex - 1 : slideIndex + 1;

      if (newIndex < 0 || newIndex >= slides.length) return;

      setOperationLoading(true);
      try {
        const updatedSlides = [...slides];
        // Intercambiar posiciones
        [updatedSlides[slideIndex], updatedSlides[newIndex]] = [
          updatedSlides[newIndex],
          updatedSlides[slideIndex],
        ];

        // Actualizar órdenes
        const slidesWithNewOrder = updatedSlides.map((slide, index) => ({
          _id: slide._id,
          order: index,
        }));

        await updateMultipleSlides(slidesWithNewOrder);
      } catch (err) {
        alert("Error al reordenar slides");
        console.error(err);
      } finally {
        setOperationLoading(false);
      }
    },
    [slides, updateMultipleSlides],
  );

  if (loading && slides.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <span className={styles.spinner}>⏳</span>
          Cargando slides...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h3>🖼️ Administrar Hero Slider</h3>
          <span className={styles.summary}>
            {slides.filter((s) => s.isActive).length} slides activos de{" "}
            {slides.length} totales
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.refreshButton}
            onClick={refresh}
            disabled={loading}
          >
            🔄 Refrescar
          </button>
          <button
            className={styles.addButton}
            onClick={handleCreate}
            disabled={operationLoading}
          >
            ➕ Nuevo Slide
          </button>
          {onClose && (
            <button className={styles.closeButton} onClick={onClose}>
              ✖️ Cerrar
            </button>
          )}
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className={styles.contentWrapper}>
        {/* Error */}
        {error && (
          <div className={styles.error}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {/* Formulario de edición/creación */}
        {(editingSlide || isCreating) && (
          <div className={styles.formContainer}>
            <h4>{isCreating ? "Crear Nuevo Slide" : "Editar Slide"}</h4>

            {/* Upload de imagen */}
            <div className={styles.formGroup}>
              <label>Imagen * (se comprimirá automáticamente)</label>

              {/* Input oculto para selección de archivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                style={{ display: "none" }}
              />

              {/* Zona de drop */}
              <div
                className={`${styles.dropZone} ${dragActive ? styles.dragActive : ""} ${isCompressing ? styles.compressing : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={openFileSelector}
              >
                {isCompressing ? (
                  <div className={styles.compressingState}>
                    <span className={styles.spinner}>⏳</span>
                    <p>Comprimiendo imagen...</p>
                  </div>
                ) : formData.imagePreview ? (
                  <div className={styles.imagePreviewContainer}>
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className={styles.imagePreviewLarge}
                    />
                    <button
                      type="button"
                      className={styles.clearImageButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        clearImage();
                      }}
                    >
                      ✖️ Quitar imagen
                    </button>
                  </div>
                ) : (
                  <div className={styles.dropZoneContent}>
                    <span className={styles.uploadIcon}>📤</span>
                    <p>Arrastra una imagen aquí o haz clic para seleccionar</p>
                    <span className={styles.uploadHint}>
                      JPG, PNG, WEBP o GIF (máx. 10MB)
                    </span>
                  </div>
                )}
              </div>

              {/* Info de compresión */}
              {compressionInfo && (
                <div className={styles.compressionInfo}>
                  <span className={styles.compressionIcon}>✅</span>
                  <span>
                    Comprimido: {compressionInfo.originalSize} →{" "}
                    {compressionInfo.compressedSize}
                  </span>
                  {compressionInfo.compressionRatio > 0 && (
                    <span className={styles.compressionRatio}>
                      (-{compressionInfo.compressionRatio}%)
                    </span>
                  )}
                </div>
              )}

              {/* Alternativa: URL manual */}
              <div className={styles.urlAlternative}>
                <span>O ingresa una URL de imagen:</span>
                <input
                  type="text"
                  value={
                    typeof formData.image === "string" ? formData.image : ""
                  }
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      image: e.target.value,
                      imagePreview: e.target.value,
                    }));
                    setCompressionInfo(null);
                  }}
                  placeholder="https://... o /uploads/..."
                  disabled={formData.image instanceof File}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Título (opcional)</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Ej: Bienvenido a Arcoiris"
                maxLength={100}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Subtítulo (opcional)</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                placeholder="Ej: Joyería artesanal de autor"
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Slide activo (visible en el sitio)
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                className={styles.saveButton}
                onClick={handleSave}
                disabled={operationLoading || isCompressing}
              >
                {operationLoading ? "Guardando..." : "💾 Guardar"}
              </button>
              <button
                className={styles.cancelButton}
                onClick={resetForm}
                disabled={operationLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Lista de slides */}
        <div className={styles.slidesList}>
          {slides.length === 0 ? (
            <div className={styles.emptyState}>
              <span>📭</span>
              <p>No hay slides configurados</p>
              <button className={styles.addButton} onClick={handleCreate}>
                ➕ Crear primer slide
              </button>
            </div>
          ) : (
            slides.map((slide, index) => (
              <div
                key={slide._id || index}
                className={`${styles.slideItem} ${!slide.isActive ? styles.inactive : ""}`}
              >
                <div className={styles.slideOrder}>
                  <button
                    className={styles.orderButton}
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0 || operationLoading}
                    title="Mover arriba"
                  >
                    ⬆️
                  </button>
                  <span className={styles.orderNumber}>{index + 1}</span>
                  <button
                    className={styles.orderButton}
                    onClick={() => handleMove(index, "down")}
                    disabled={index === slides.length - 1 || operationLoading}
                    title="Mover abajo"
                  >
                    ⬇️
                  </button>
                </div>

                <div className={styles.slideImage}>
                  <img
                    src={getServerImageUrl(slide.image)}
                    alt={slide.title || "Slide"}
                    onLoad={(e) => {
                      // Asegurar que la imagen se muestre cuando carga correctamente
                      const target = e.target as HTMLImageElement;
                      target.style.display = "block";
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      // Evitar loop infinito: solo cambiar si no es ya el placeholder
                      if (!target.dataset.errored) {
                        target.dataset.errored = "true";
                        target.style.display = "none";
                        console.warn("Error cargando imagen:", slide.image);
                      }
                    }}
                  />
                  <div className={styles.imageFallback}>📷</div>
                </div>

                <div className={styles.slideInfo}>
                  <h5 className={styles.slideTitle}>
                    {slide.title || (
                      <span className={styles.noTitle}>Sin título</span>
                    )}
                  </h5>
                  {slide.subtitle && (
                    <p className={styles.slideSubtitle}>{slide.subtitle}</p>
                  )}
                  <span
                    className={`${styles.statusBadge} ${slide.isActive ? styles.active : styles.inactive}`}
                  >
                    {slide.isActive ? "✅ Activo" : "❌ Inactivo"}
                  </span>
                </div>

                <div className={styles.slideActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(slide)}
                    disabled={operationLoading}
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    className={styles.toggleButton}
                    onClick={() => handleToggleActive(slide)}
                    disabled={operationLoading}
                    title={slide.isActive ? "Desactivar" : "Activar"}
                  >
                    {slide.isActive ? "🔒" : "🔓"}
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(slide)}
                    disabled={operationLoading}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSliderManager;
