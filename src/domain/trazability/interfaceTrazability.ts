import { User } from "@/types";

// * INTEGRACIONES EN LOS SERVICIOS DE LA APP
/*
    !IMPLEMENTACIÓN RÁPIDA

    ? DECLARACIÓN.
    private trazabilityService = new TrazabilityService()

    ? MÉTODO DENTRO DEL SERVICIO.
    async insertTrazability(data: TrazabilityServiceParams) {
        await this.trazabilityService.registerTrazability(data);
    }
*/

// acciones que se van a hacer sobre los modulos, esto con el fin de facilitar los iconos

// ! NOTA. Añade en front también el icono de la actividad.
export enum ActionsValues {
    CREAR = 'CREAR',
    'ACTUALIZAR O MODIFICAR DOCUMENTOS' = 'ACTUALIZAR O MODIFICAR DOCUMENTOS',
    ELIMINAR = 'ELIMINAR',
    APROBAR = 'APROBAR',
    RECHAZAR = 'RECHAZAR',
    'COMPLETAR MANTENIMIENTO' = 'COMPLETAR MANTENIMIENTO',
    'SUBIR DOCUMENTOS' = 'SUBIR DOCUMENTOS',
    'GENERAR INFORMES' = 'GENERAR INFORMES',
    'PROGRAMAR EVENTOS' = 'PROGRAMAR EVENTOS',
    ALERTAS = 'ALERTAS',
    'ACTUALIZAR LIBRE DEL EDIFICIO' = 'ACTUALIZAR LIBRE DEL EDIFICIO',
    'APROBAR PRESUPUESTO' = 'APROBAR PRESUPUESTO',
    'ACTUALIZAR DATOS FINANCIEROS' = 'ACTUALIZAR DATOS FINANCIEROS',
    'COMPLETAR INSPECCION ELECTRICA' = 'COMPLETAR INSPECCION ELECTRICA',
}

// Módulos que se le pueden asignar a la trazabilidad

export enum ModuleValues {
    ELECTRICIDAD = 'ELECTRICIDAD',
    FINANZAS = 'FINANZAS',
    DOCUMENTOS = 'DOCUMENTOS',
    ALERTAS = 'ALERTAS',
    'LIBRO-DIGITAL' = 'LIBRO-DIGITAL',
    CALENDARIO = 'CALENDARIO',
    INFORME = 'INFORME',
    USUARIOS = 'USUARIOS',
    UBICACIONES = 'UBICACIONES',
}

// Interfaz para parametros del servicio de trazabilidad de la App.
export interface TrazabilityServiceParams {
    action: ActionsValues,
    module: ModuleValues,
    description: string,
    buildingId: string | null,
    authUserId: string | null,
}

export interface trazabilityPayload {
    user_id: any;
    description: string;
    action: ActionsValues;
    module: ModuleValues;
    building_id: string | null;
}


export interface trazabilidadRequest {
    buildingId?: string;
    userAuthId?: string;
    module?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
}

export interface getTrazabilityMap extends trazabilidadRequest {
    id?: string;
    description?: string;
    createdAt: string;
    user: User | null;
    building: { id: string, name: string, address: string } | null;

}


// Interfaz para mapeo al de datos de respuesta del objeto
export interface TrazabilityMap extends TrazabilityServiceParams {
    id: string,
    createdAt: string,
    authUserId: string,
    buildingId: string,
}

export interface TrazabilityCounts {
    [action: string]: number;
}

export interface ListTrazabilityResponse {
    data: getTrazabilityMap[];
    total: number;
    counts: TrazabilityCounts;
}


export interface responseListTrazability {
    data: any[];
    total: number;
    activeUsers: number;
    completed: number;
    alerts: number;
    updates: number;
}