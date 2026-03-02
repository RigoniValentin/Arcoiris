import {
  SlotUpdateResponse,
  SlotDeleteResponse,
  SlotReorderResponse,
  SlotsGetResponse,
} from "../types/imageSlots";
import { API_BASE_URL } from "../config/api";

// Helper para extraer mensaje de error del backend
async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await response.json();
    return body.message || body.error || fallback;
  } catch {
    return fallback;
  }
}

class ImageSlotsService {
  private baseUrl = `${API_BASE_URL}/products`;

  // Obtener slots de un producto
  async getSlots(productId: string): Promise<SlotsGetResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}/slots`);

      if (!response.ok) {
        // Si es 404, el endpoint no existe aún (backend no implementado)
        if (response.status === 404) {
          throw new Error("ENDPOINT_NOT_IMPLEMENTED");
        }
        const msg = await extractErrorMessage(
          response,
          `HTTP error! status: ${response.status}`,
        );
        throw new Error(msg);
      }

      // Verificar si la respuesta es JSON válido
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("INVALID_RESPONSE_FORMAT");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Solo logear errores inesperados, no los de endpoints no implementados
      const err = error as Error;
      if (
        err.message !== "ENDPOINT_NOT_IMPLEMENTED" &&
        err.message !== "INVALID_RESPONSE_FORMAT"
      ) {
        console.error("Error fetching slots:", error);
      }
      throw error;
    }
  }

  // Actualizar un slot específico
  async updateSlot(
    productId: string,
    slot: number,
    file: File,
  ): Promise<SlotUpdateResponse> {
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("slot", slot.toString());

      const response = await fetch(
        `${this.baseUrl}/${productId}/slots/${slot}`,
        {
          method: "PUT",
          body: formData,
        },
      );

      if (!response.ok) {
        const msg = await extractErrorMessage(
          response,
          `Error al actualizar imagen (status: ${response.status})`,
        );
        throw new Error(msg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error updating slot:", error);
      throw error;
    }
  }

  // Eliminar imagen de un slot
  async deleteSlot(
    productId: string,
    slot: number,
  ): Promise<SlotDeleteResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${productId}/slots/${slot}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const msg = await extractErrorMessage(
          response,
          `Error al eliminar imagen (status: ${response.status})`,
        );
        throw new Error(msg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error deleting slot:", error);
      throw error;
    }
  }

  // Reordenar slots (mover imagen de un slot a otro)
  async reorderSlots(
    productId: string,
    fromSlot: number,
    toSlot: number,
  ): Promise<SlotReorderResponse> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${productId}/slots/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromSlot,
            toSlot,
          }),
        },
      );

      if (!response.ok) {
        const msg = await extractErrorMessage(
          response,
          `Error al reordenar imágenes (status: ${response.status})`,
        );
        throw new Error(msg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error reordering slots:", error);
      throw error;
    }
  }

  // Subir múltiples imágenes (para mantener compatibilidad con el sistema anterior)
  async uploadMultipleImages(productId: string, files: File[]): Promise<any> {
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append(`images`, file);
      });

      const response = await fetch(`${this.baseUrl}/${productId}/images`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const msg = await extractErrorMessage(
          response,
          `Error al subir imágenes (status: ${response.status})`,
        );
        throw new Error(msg);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error uploading multiple images:", error);
      throw error;
    }
  }
}

export const imageSlotsService = new ImageSlotsService();
