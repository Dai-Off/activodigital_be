export class PVGISApiService {
  private urlPVGIS: string;
  private options: RequestInit;

  constructor() {
    if (!process.env.PVGIS_URL) {
      throw new Error("Faltan variables de entorno: PVGIS_URL.");
    }

    this.urlPVGIS = process.env.PVGIS_URL;
    this.options = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  /**
   * Calcula la energía producida por un sistema FV conectado a la red, especificando el tipo de montaje.
   * Endpoint: /api/v5_3/PVcalc
   * @param lat Latitud.
   * @param lon Longitud.
   * @param peakpower Potencia pico instalada en kW.
   * @param loss Pérdidas estimadas del sistema en %.
   * @param mountingplace Tipo de montaje: 'free' (suelo) o 'building' (integrado en edificio).
   */
  async GetBuildingPVEnergyOutput(
    lat: string,
    lon: string,
    peakpower: string,
    loss: string,
    mountingplace: "free" | "building" = "building"
  ) {
    try {
      const baseUrl = `${this.urlPVGIS}/PVcalc`;
      const url = new URL(baseUrl);
      url.searchParams.append("lat", lat);
      url.searchParams.append("lon", lon);
      url.searchParams.append("peakpower", peakpower);
      url.searchParams.append("loss", loss);
      url.searchParams.append("mountingplace", mountingplace);
      url.searchParams.append("outputformat", "json");
      url.searchParams.append("browser", "0");

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud (Building PV):", error);
      return null;
    }
  }

  /**
   * Obtiene datos por hora de irradiación solar y/o producción de PV para un análisis detallado.
   * Endpoint: /api/v5_3/seriescalc
   * @param lat Latitud.
   * @param lon Longitud.
   * @param pvcalculation 1 para calcular producción PV, 0 para solo datos solares brutos.
   * @param peakpower Potencia pico instalada en kW (requerido si pvcalculation=1).
   * @param loss Pérdidas estimadas en % (requerido si pvcalculation=1).
   */
  async GetDetailedHourlyData(
    lat: string,
    lon: string,
    pvcalculation: "0" | "1",
    peakpower?: string,
    loss?: string
  ) {
    try {
      const baseUrl = `${this.urlPVGIS}/seriescalc`;
      const url = new URL(baseUrl);
      url.searchParams.append("lat", lat);
      url.searchParams.append("lon", lon);
      url.searchParams.append("outputformat", "json");
      url.searchParams.append("browser", "0");
      url.searchParams.append("pvcalculation", pvcalculation);

      if (pvcalculation === "1" && peakpower && loss) {
        url.searchParams.append("peakpower", peakpower);
        url.searchParams.append("loss", loss);
      }

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud de datos horarios:", error);
      return null;
    }
  }

  /**
   * Genera datos de un Año Meteorológico Típico (TMY) en formato JSON.
   * Endpoint: /api/v5_3/tmy
   * @param lat Latitud.
   * @param lon Longitud.
   */
  async GetTypicalMeteorologicalYear(lat: string, lon: string) {
    try {
      const baseUrl = `${this.urlPVGIS}/tmy`;
      const url = new URL(baseUrl);
      url.searchParams.append("lat", lat);
      url.searchParams.append("lon", lon);
      // Nota: TMY no necesita outputformat=json, pero lo incluimos por consistencia.
      url.searchParams.append("outputformat", "json");
      url.searchParams.append("browser", "0");

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      // La respuesta TMY JSON es una estructura con datos por hora.
      return data;
    } catch (error) {
      console.error("Error en la solicitud TMY:", error);
      return null;
    }
  }

  /**
   * Obtiene la radiación solar promedio mensual en diferentes planos.
   * Endpoint: /api/v5_3/MRcalc
   * @param lat Latitud.
   * @param lon Longitud.
   * @param horirrad 1 para radiación horizontal.
   * @param optrad 1 para radiación en ángulo óptimo.
   */
  async GetMonthlyRadiation(
    lat: string,
    lon: string,
    horirrad: "0" | "1",
    optrad: "0" | "1"
  ) {
    try {
      if (horirrad === "0" && optrad === "0") {
        throw new Error("Debe especificar al menos 'horirrad' o 'optrad'.");
      }

      const baseUrl = `${this.urlPVGIS}/MRcalc`;
      const url = new URL(baseUrl);
      url.searchParams.append("lat", lat);
      url.searchParams.append("lon", lon);
      url.searchParams.append("outputformat", "json");
      url.searchParams.append("browser", "0");
      url.searchParams.append("horirrad", horirrad);
      url.searchParams.append("optrad", optrad);

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();
      return data;
    } catch (error) {
      console.error("Error en la solicitud de Radiación Mensual:", error);
      return null;
    }
  }
}
