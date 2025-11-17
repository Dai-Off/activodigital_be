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
