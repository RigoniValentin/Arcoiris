import { ApiResponse } from "../types/shop";
import { API_BASE_URL } from "../config/api";

class ApiClient {
  private baseUrl: string;
  private authToken?: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = undefined;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    // Solo añadir Content-Type si no es FormData
    if (!(options.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    // Añadir token de autorización si existe
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }

    console.log(`🌐 API Request: ${options.method || "GET"} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("❌ API Error:", data);
        throw new Error(
          data.message || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      console.log("✅ API Success:", data);
      return data;
    } catch (error) {
      console.error("💥 Network Error:", error);
      throw error;
    }
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    let searchParams = "";

    if (params) {
      const filteredParams = Object.entries(params)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          // Codificar correctamente el valor, especialmente caracteres como +
          const encodedValue = encodeURIComponent(String(value));
          return `${encodeURIComponent(key)}=${encodedValue}`;
        });

      if (filteredParams.length > 0) {
        searchParams = `?${filteredParams.join("&")}`;
      }
    }

    const fullUrl = `${endpoint}${searchParams}`;

    return this.request<T>(fullUrl);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: formData,
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async putFormData<T>(
    endpoint: string,
    formData: FormData,
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: formData,
    });
  }

  async delete<T>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<ApiResponse<T>> {
    const searchParams = params
      ? `?${new URLSearchParams(
          Object.entries(params)
            .filter(([_, value]) => value !== undefined && value !== null)
            .map(([key, value]) => [key, String(value)]),
        )}`
      : "";

    return this.request<T>(`${endpoint}${searchParams}`, {
      method: "DELETE",
    });
  }
}

export const apiClient = new ApiClient();
