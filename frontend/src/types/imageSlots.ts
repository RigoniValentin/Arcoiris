// Types for the new image slots system

export interface ImageSlot {
  slot: number; // 0-5
  position: number; // 1-6 (para mostrar al usuario)
  imageUrl: string | null;
  isEmpty: boolean;
  isPrimary: boolean;
}

export interface ImageSlotsManagerProps {
  productId: string;
  onImagesUpdate?: (gallery: string[]) => void;
  onPrimaryImageChange?: (imageUrl: string) => void;
  maxFileSize?: number; // default: 50MB
  acceptedFormats?: string[]; // default: ['jpeg', 'png', 'webp', 'gif']
}

export interface SlotItemProps {
  slot: ImageSlot;
  isLoading: boolean;
  onImageUpdate: (file: File) => Promise<void>;
  onImageDelete: () => Promise<void>;
  onDragStart: (fromSlot: number) => void;
  onDrop: (toSlot: number) => Promise<void>;
  canDelete: boolean; // false si es la última imagen
  isDragOver?: boolean;
  isDragging?: boolean;
}

export interface UseImageSlotsReturn {
  slots: ImageSlot[];
  loading: boolean;
  error: string | null;
  summary: {
    total: number;
    occupied: number;
    empty: number;
  };

  // Acciones
  updateSlot: (slot: number, file: File) => Promise<void>;
  deleteSlot: (slot: number) => Promise<void>;
  reorderSlots: (fromSlot: number, toSlot: number) => Promise<void>;
  refreshSlots: () => Promise<void>;
}

// API Response types
export interface SlotUpdateResponse {
  success: boolean;
  data: {
    slots: ImageSlot[];
    gallery: string[];
    primaryImage: string;
  };
}

export interface SlotDeleteResponse {
  success: boolean;
  data: {
    slots: ImageSlot[];
    gallery: string[];
    primaryImage: string;
  };
}

export interface SlotReorderResponse {
  success: boolean;
  data: {
    slots: ImageSlot[];
    gallery: string[];
    primaryImage: string;
  };
}

export interface SlotsGetResponse {
  success: boolean;
  data: {
    productId: string;
    productName: string;
    primaryImage: string;
    slots: ImageSlot[];
  };
}

// File validation
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
}

// Drag and drop
export interface DragDropState {
  draggedSlot: number | null;
  dropTargetSlot: number | null;
  isDragging: boolean;
}
