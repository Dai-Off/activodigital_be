// Dirección estructurada del edificio.
// Esta estructura se corresponde con el JSON que se guarda en backend (address_data).
export interface BuildingAddressData {
  /** Dirección completa legible (por ejemplo, para mostrar en UI) */
  fullAddress: string;
  /** Provincia (ej: "Madrid") */
  province?: string;
  /** Municipio o ciudad (ej: "Madrid") */
  municipality?: string;
  /** Tipo de vía (ej: "Calle", "Avenida") */
  streetType?: string;
  /** Nombre de la vía (ej: "Gran Vía") */
  streetName?: string;
  /** Número de portal */
  number?: string;
  /** Escalera */
  stair?: string;
  /** Planta */
  floor?: string;
  /** Puerta */
  door?: string;
  /** Código postal */
  postalCode?: string;
  /** País (ej: "España") */
  country?: string;
  /** Campo libre para datos adicionales o raw del proveedor (Catastro, Nominatim, etc.) */
  extra?: Record<string, any>;
}


