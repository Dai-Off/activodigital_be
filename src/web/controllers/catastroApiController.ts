import { Request, Response } from "express";
import { CatastroApiService } from "../../domain/services/catastroApiService";

const catastroApiService = new CatastroApiService();

export const getAllProvincias = async (req: Request, res: Response) => {
  try {
    const provincias = await catastroApiService.getAllProvincias();
    if (!provincias) {
      return res.status(404).json({ error: "No se pudieron obtener las provincias" });
    }
    res.status(200).json(provincias);
  } catch (error: any) {
    console.error("[CatastroApiController] Error al obtener las provincias:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
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
    console.error("[CatastroApiController] Error al obtener los municipios:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
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
    console.error("[CatastroApiController] Error al obtener las vías:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
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
    console.error("[CatastroApiController] Error al obtener el inmueble por RC:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
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
    console.error("[CatastroApiController] Error al obtener el inmueble por localización:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
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
    console.error("[CatastroApiController] Error al obtener el inmueble por coordenadas:", error);
    const status = error?.status || 500;
    const message = error?.message || "Error interno del servidor";
    res.status(status).json({ 
      error: message,
      details: status === 403 ? "Error de autenticación con la API de Catastro. Verifica las credenciales." : undefined
    });
  }
};
