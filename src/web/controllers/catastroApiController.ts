import { Request, Response } from "express";
import { CatastroApiService } from "../../domain/services/catastroApiService";

const catastroApiService = new CatastroApiService();

export const getAllProvincias = async (req: Request, res: Response) => {
  try {
    const provincias = await catastroApiService.getAllProvincias();
    res.status(200).json(provincias);
  } catch (error) {
    console.error("Error al obtener las provincias", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getMunicipios = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;

  try {
    const municipios = await catastroApiService.getMunicipios(provincia);
    res.status(200).json(municipios);
  } catch (error) {
    console.error("Error al obtener los municipios", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getVias = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;
  const municipio = req.query.municipio as string;
  let tipoVia = "";
  let nombreVia = "";
  if (req.query.tipoVia) {
    tipoVia = req.query.tipoVia as string;
  }
  if (req.query.nombreVia) {
    nombreVia = req.query.nombreVia as string;
  }

  try {
    const municipios = await catastroApiService.getVias(
      provincia,
      municipio,
      tipoVia,
      nombreVia
    );
    res.status(200).json(municipios);
  } catch (error) {
    console.error("Error al obtener los municipios", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getInmuebleRc = async (req: Request, res: Response) => {
  const rc = req.query.rc as string;
  try {
    const inmueble = await catastroApiService.getInmuebleRc(rc);
    res.status(200).json(inmueble);
  } catch (error) {
    console.error("Error al obtener el inmueble", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getInmuebleLoc = async (req: Request, res: Response) => {
  const provincia = req.query.provincia as string;
  const municipio = req.query.municipio as string;
  const tipoVia = req.query.tipoVia as string;
  const nombreVia = req.query.nombreVia as string;
  const numero = req.query.numero as string;
  let bloque = "";
  let escalera = "";
  let planta = "";
  let puerta = "";

  if (req.query.bloque) {
    bloque = req.query.bloque as string;
  }
  if (req.query.escalera) {
    escalera = req.query.escalera as string;
  }
  if (req.query.planta) {
    planta = req.query.planta as string;
  }
  if (req.query.puerta) {
    puerta = req.query.puerta as string;
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
    res.status(200).json(inmueble);
  } catch (error) {
    console.error("Error al obtener el inmueble", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

export const getInmuebleXY = async (req: Request, res: Response) => {
  const x = req.query.x as string;
  const y = req.query.y as string;

  try {
    const inmueble = await catastroApiService.getInmuebleXY(x, y);
    res.status(200).json(inmueble);
  } catch (error) {
    console.error("Error al obtener el inmueble", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
