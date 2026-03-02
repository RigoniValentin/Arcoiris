import { apiClient } from "./apiClient";
import { API_BASE_URL } from "../config/api";

export interface HeroSlide {
  _id?: string;
  id?: string | number;
  title?: string;
  subtitle?: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface HeroSlideFormData {
  title?: string;
  subtitle?: string;
  image?: string | File;
  order?: number;
  isActive?: boolean;
}

export interface HeroSlideResponse {
  success: boolean;
  data: HeroSlide | HeroSlide[];
  message?: string;
  count?: number;
}

// Helper para obtener el token del usuario logueado
const getAuthToken = (): string | null => {
  try {
    // El token se almacena por separado en "authToken"
    const token = localStorage.getItem("authToken");
    if (token) {
      return token;
    }
  } catch (error) {
    console.error("Error getting auth token:", error);
  }
  return null;
};

// Helper para configurar el token en apiClient
const setAuthToken = () => {
  const token = getAuthToken();
  if (token) {
    apiClient.setAuthToken(token);
  }
};

class HeroSlideService {
  private endpoint = "/hero-slides";

  // Obtener slides activos (público - NO requiere auth)
  async getActiveSlides(): Promise<HeroSlide[]> {
    try {
      const response = await apiClient.get<HeroSlide[]>(
        `${this.endpoint}/active`,
      );
      return (response as any).data || [];
    } catch (error) {
      console.error("Error al obtener slides activos:", error);
      return [];
    }
  }

  // Obtener todos los slides (admin - requiere auth)
  async getAllSlides(): Promise<HeroSlide[]> {
    try {
      setAuthToken();
      const response = await apiClient.get<HeroSlide[]>(this.endpoint);
      return (response as any).data || [];
    } catch (error) {
      console.error("Error al obtener todos los slides:", error);
      throw error;
    }
  }

  // Obtener un slide por ID (admin - requiere auth)
  async getSlideById(id: string): Promise<HeroSlide | null> {
    try {
      setAuthToken();
      const response = await apiClient.get<HeroSlide>(`${this.endpoint}/${id}`);
      return (response as any).data || null;
    } catch (error) {
      console.error("Error al obtener slide:", error);
      throw error;
    }
  }

  // Crear un nuevo slide (admin - requiere auth)
  async createSlide(slideData: HeroSlideFormData): Promise<HeroSlide> {
    try {
      const token = getAuthToken();

      // Si hay un archivo de imagen, usar FormData
      if (slideData.image instanceof File) {
        const formData = new FormData();
        formData.append("image", slideData.image);
        if (slideData.title) formData.append("title", slideData.title);
        if (slideData.subtitle) formData.append("subtitle", slideData.subtitle);
        if (slideData.order !== undefined)
          formData.append("order", slideData.order.toString());
        if (slideData.isActive !== undefined)
          formData.append("isActive", slideData.isActive.toString());

        const response = await fetch(`${API_BASE_URL}${this.endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Error al crear slide");
        return data.data;
      }

      // Si es URL, usar JSON normal
      setAuthToken();
      const response = await apiClient.post<HeroSlide>(
        this.endpoint,
        slideData,
      );
      return (response as any).data;
    } catch (error) {
      console.error("Error al crear slide:", error);
      throw error;
    }
  }

  // Actualizar un slide (admin - requiere auth)
  async updateSlide(
    id: string,
    slideData: HeroSlideFormData,
  ): Promise<HeroSlide> {
    try {
      const token = getAuthToken();

      // Si hay un archivo de imagen, usar FormData
      if (slideData.image instanceof File) {
        const formData = new FormData();
        formData.append("image", slideData.image);
        if (slideData.title !== undefined)
          formData.append("title", slideData.title || "");
        if (slideData.subtitle !== undefined)
          formData.append("subtitle", slideData.subtitle || "");
        if (slideData.order !== undefined)
          formData.append("order", slideData.order.toString());
        if (slideData.isActive !== undefined)
          formData.append("isActive", slideData.isActive.toString());

        const response = await fetch(`${API_BASE_URL}${this.endpoint}/${id}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Error al actualizar slide");
        return data.data;
      }

      // Si es URL o sin imagen, usar JSON normal
      setAuthToken();
      const response = await apiClient.put<HeroSlide>(
        `${this.endpoint}/${id}`,
        slideData,
      );
      return (response as any).data;
    } catch (error) {
      console.error("Error al actualizar slide:", error);
      throw error;
    }
  }

  // Actualizar múltiples slides (admin - requiere auth)
  async updateMultipleSlides(
    slides: Partial<HeroSlide>[],
  ): Promise<HeroSlide[]> {
    try {
      setAuthToken();
      const response = await apiClient.put<HeroSlide[]>(
        `${this.endpoint}/bulk`,
        { slides },
      );
      return (response as any).data || [];
    } catch (error) {
      console.error("Error al actualizar múltiples slides:", error);
      throw error;
    }
  }

  // Eliminar un slide (admin - requiere auth)
  async deleteSlide(id: string): Promise<void> {
    try {
      setAuthToken();
      await apiClient.delete(`${this.endpoint}/${id}`);
    } catch (error) {
      console.error("Error al eliminar slide:", error);
      throw error;
    }
  }

  // Inicializar slides por defecto (admin - requiere auth)
  async initializeDefaultSlides(): Promise<HeroSlide[]> {
    try {
      setAuthToken();
      const response = await apiClient.post<HeroSlide[]>(
        `${this.endpoint}/initialize`,
        {},
      );
      return (response as any).data || [];
    } catch (error) {
      console.error("Error al inicializar slides por defecto:", error);
      throw error;
    }
  }
}

export const heroSlideService = new HeroSlideService();
