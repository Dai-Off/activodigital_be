export class CatastroApiService {
  private key: string;
  private urlCatastro: string;
  private options: RequestInit;

  constructor() {
    if (!process.env.CATASTRO_KEY || !process.env.CATASTRO_URL) {
      throw new Error(
        "Faltan variables de entorno: CATASTRO_KEY y/o CATASTRO_URL."
      );
    }

    this.key = process.env.CATASTRO_KEY;
    this.urlCatastro = process.env.CATASTRO_URL;
    this.options = {
      method: "GET",
      headers: {
        "X-API-Key": `${this.key}`,
        "Content-Type": "application/json",
      },
    };
  }

  async getAllProvincias(): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.urlCatastro}/api/callejero/provincias`,
        this.options
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();

      return data;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return null;
    }
  }

  async getMunicipios(provincia: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.urlCatastro}/api/callejero/municipios?provincia=${provincia}`,
        this.options
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();

      return data;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return null;
    }
  }

  async getVias(
    provincia: string,
    municipio: string,
    tipoVia?: string,
    nombreVia?: string
  ): Promise<any | null> {
    try {
      const baseUrl = `${this.urlCatastro}/api/callejero/vias`;
      const url = new URL(baseUrl);
      url.searchParams.append("provincia", provincia);
      url.searchParams.append("municipio", municipio);

      if (tipoVia) {
        url.searchParams.append("tipoVia", tipoVia);
      }

      if (nombreVia) {
        url.searchParams.append("nombreVia", nombreVia);
      }

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();

      return data;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return "Hubo un error al consultar las vias";
    }
  }

  async getInmuebleRc(rc: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${rc}`,
        this.options
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();

      return data;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return null;
    }
  }

  async getInmuebleLoc(
    provincia: string,
    municipio: string,
    tipoVia: string,
    nombreVia: string,
    numero: string,
    bloque?: string,
    escalera?: string,
    planta?: string,
    puerta?: string
  ): Promise<any | null> {
    try {
      const baseUrl = `${this.urlCatastro}/api/callejero/inmueble-localizacion`;
      const url = new URL(baseUrl);
      url.searchParams.append("provincia", provincia);
      url.searchParams.append("municipio", municipio);
      url.searchParams.append("tipoVia", tipoVia);
      url.searchParams.append("nombreVia", nombreVia);
      url.searchParams.append("numero", numero);
      if (bloque) {
        url.searchParams.append("bloque", bloque);
      }
      if (escalera) {
        url.searchParams.append("escalera", escalera);
      }
      if (planta) {
        url.searchParams.append("planta", planta);
      }
      if (puerta) {
        url.searchParams.append("puerta", puerta);
      }

      const response = await fetch(url.toString(), this.options);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data: any = await response.json();

      return data;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return "Hubo un error al consultar el inmueble";
    }
  }

  async getInmuebleXY(x: string, y: string): Promise<any | null> {
    interface resultadoLoc {
      pc1: string;
      pc2: string;
      referenciaCatastral: string;
      direccion: string;
    }
    try {
      const localizacion = await fetch(
        `${this.urlCatastro}/api/coordenadas/rc-por-coordenadas?x=${x}&y=${y}`,
        this.options
      );
      const dataLoc = await localizacion.json();
      const listadoLoc: resultadoLoc[] = dataLoc.referencias;
      const promesasInmuebles = listadoLoc.map(async (resultadoLoc) => {
        const rc = resultadoLoc.referenciaCatastral;

        const responseInmueble = await fetch(
          `${this.urlCatastro}/api/callejero/inmueble-rc?rc=${rc}`,
          this.options
        );

        const detailInmueble: any = await responseInmueble.json();

        return detailInmueble;
      });

      const listadoInmuebles: any[] = await Promise.all(promesasInmuebles);

      return listadoInmuebles;
    } catch (error) {
      console.error("Error en la solicitud:", error);
      return "Hubo un error al consultar el inmueble";
    }
  }
}
