export interface IdealistaProperty {
  url: string;
  title: string;
  price: number;
  currency: string;
  thumbnail?: string;
  location?: string;
  rooms?: number;
  area?: number;
}

export interface ScrapeIdealistaRequest {
  searchUrl?: string;
  locationName?: string; // Nombre que el usuario envía (ej: "Madrid")
  maxItems?: number;
}

export interface ApifyRunResponse {
  totalItems: number;
  items: IdealistaProperty[];
  averagePrice: number;
  averagePricePerSqm: number;
}

// Estructura simplificada del JSON de igolaizola
export interface IgolaizolaLocation {
  type: string; // Añadimos esto para que coincida al 100%
  name: string; // Cambiado de 'nombre' a 'name'
  id: string;
}
