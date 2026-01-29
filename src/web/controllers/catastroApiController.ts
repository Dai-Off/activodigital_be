import { Request, Response } from "express";
import { CatastroApiService } from "../../domain/services/catastroApiService";

const catastroApiService = new CatastroApiService();

const handleExternalApiError = (res: Response, error: any) => {
  console.error("[CatastroApiController] Error Catastro:", error);
  const status = error?.status || 500;
  const message = error?.message || "Error interno del servidor";

  const finalStatus = status === 401 ? 500 : status;

  res.status(finalStatus).json({
    error: message,
    details:
      finalStatus === 403
        ? "Error de autenticación con la API de Catastro. Verifica las credenciales."
        : undefined,
    source: "catastro_external_api",
  });
};

export const getAllProvincias = async (req: Request, res: Response) => {
  try {
    const provincias = await catastroApiService.getAllProvincias();
    if (!provincias) {
      return res.status(404).json({ error: "No se pudieron obtener las provincias" });
    }
    res.status(200).json(provincias);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener las provincias:",
      error
    );
    handleExternalApiError(res, error);
  }
};

export const getMunicipios = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;

  if (!provincia) {
    return res.status(400).json({ error: "El parámetro 'provincia' es requerido" });
  }

  try {
    const municipios = await catastroApiService.getMunicipios(provincia);
    if (!municipios) {
      return res.status(404).json({ error: "No se pudieron obtener los municipios" });
    }
    res.status(200).json(municipios);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener los municipios:",
      error
    );
    handleExternalApiError(res, error);
  }
};

export const getVias = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;
  const municipio = req.query.municipio as string;
  const tipoVia = req.query.tipoVia as string | undefined;
  const nombreVia = req.query.nombreVia as string | undefined;

  if (!provincia || !municipio) {
    return res.status(400).json({ error: "Los parámetros 'provincia' y 'municipio' son requeridos" });
  }

  try {
    const vias = await catastroApiService.getVias(
      provincia,
      municipio,
      tipoVia,
      nombreVia
    );
    if (!vias) {
      return res.status(404).json({ error: "No se pudieron obtener las vías" });
    }
    res.status(200).json(vias);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener las vías:",
      error
    );
    handleExternalApiError(res, error);
  }
};

export const getInmuebleRc = async (req: Request, res: Response) => {
  const rc = req.query.rc as string;
  
  if (!rc) {
    return res.status(400).json({ error: "El parámetro 'rc' (referencia catastral) es requerido" });
  }

  try {
    const inmueble = await catastroApiService.getInmuebleRc(rc);
    if (!inmueble) {
      return res.status(404).json({ error: "No se encontró el inmueble con la referencia catastral proporcionada" });
    }
    res.status(200).json(inmueble);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener el inmueble por RC:",
      error
    );
    handleExternalApiError(res, error);
  }
};

export const getInmuebleLoc = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;
  const municipio = req.query.municipio as string;
  const tipoVia = req.query.tipoVia as string;
  const nombreVia = req.query.nombreVia as string;
  const numero = req.query.numero as string;
  const bloque = req.query.bloque as string | undefined;
  const escalera = req.query.escalera as string | undefined;
  const planta = req.query.planta as string | undefined;
  const puerta = req.query.puerta as string | undefined;

  if (!provincia || !municipio || !tipoVia || !nombreVia || !numero) {
    return res.status(400).json({ 
      error: "Los parámetros 'provincia', 'municipio', 'tipoVia', 'nombreVia' y 'numero' son requeridos" 
    });
  }

  try {
    const inmueble = await catastroApiService.getInmuebleLoc(
      provincia,
      municipio,
      tipoVia,
      nombreVia,
      numero,
      bloque,
      escalera,
      planta,
      puerta
    );
    if (!inmueble) {
      return res.status(404).json({ error: "No se encontró el inmueble con la localización proporcionada" });
    }
    res.status(200).json(inmueble);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener el inmueble por localización:",
      error
    );
    handleExternalApiError(res, error);
  }
};

export const getInmuebleXY = async (req: Request, res: Response) => {
  const x = req.query.x as string;
  const y = req.query.y as string;

  if (!x || !y) {
    return res.status(400).json({ error: "Los parámetros 'x' e 'y' (coordenadas) son requeridos" });
  }

  try {
    const inmueble = await catastroApiService.getInmuebleXY(x, y);
    if (!inmueble || (Array.isArray(inmueble) && inmueble.length === 0)) {
      return res.status(404).json({ error: "No se encontraron inmuebles en las coordenadas proporcionadas" });
    }
    res.status(200).json(inmueble);
  } catch (error: any) {
    console.error(
      "[CatastroApiController] Error al obtener el inmueble por coordenadas:",
      error
    );
    handleExternalApiError(res, error);
  }
};

/**
 * Nuevo endpoint: obtener unidades desde Catastro usando Consulta_DNPLOC (por dirección).
 * Devuelve el XML bruto para máxima fidelidad; el cliente puede parsearlo según necesidad.
 */
export const getUnidadesPorDireccion = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;
  const municipio = req.query.municipio as string;
  const siglaVia = req.query.siglaVia as string; // ej: CL
  const calle = req.query.calle as string;
  const numero = req.query.numero as string;
  const bloque = (req.query.bloque as string) || "";
  const escalera = (req.query.escalera as string) || "";
  const planta = (req.query.planta as string) || "";
  const puerta = (req.query.puerta as string) || "";

  if (!provincia || !municipio || !siglaVia || !calle || !numero) {
    return res.status(400).json({
      error:
        "Los parámetros 'provincia', 'municipio', 'siglaVia', 'calle' y 'numero' son requeridos",
    });
  }

  try {
    const result = await catastroApiService.getUnidadesPorDireccion({
      provincia,
      municipio,
      siglaVia,
      calle,
      numero,
      bloque,
      escalera,
      planta,
      puerta,
    });

    res.status(200).json(result);
  } catch (error: any) {
    handleExternalApiError(res, error);
  }
};
