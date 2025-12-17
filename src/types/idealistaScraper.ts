// types/apify.ts

export interface IdealistaProperty {
  url: string;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  location?: string;
  rooms?: number;
  area?: number; // m2
  // Agrega más campos según lo que devuelva el Actor específico de Idealista
}

export interface ScrapeIdealistaRequest {
  searchUrl: string; // La URL de búsqueda de Idealista (ej: https://idealista.com/venta-viviendas/madrid/)
  maxItems?: number; // Opcional, por defecto 50
}

export interface ApifyRunResponse {
  totalItems: number;
  items: IdealistaProperty[];
}
