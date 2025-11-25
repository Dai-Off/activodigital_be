export enum ActionsValues {
    CREAR = 'CREAR',
    ACTUALIZAR = 'ACTUALIZAR',
    ELIMINAR = 'ELIMINAR',
    APROBAR = 'APROBAR',
    RECHAZAR = 'RECHAZAR',
    COMPLETAR = 'COMPLETAR',
    SUBIR = 'SUBIR',
}

export enum ModuleValues {
    ELECTRICIDAD = 'ELECTRICIDAD',
    FINANZAS = 'FINANZAS',
    DOCUMENTOS = 'DOCUMENTOS',
    ALERTAS = 'ALERTAS',
    'LIBRO-DIGITAL' = 'LIBRO-DIGITAL',
    CALENDARIO = 'CALENDARIO',
    INFORME = 'INFORME',
    USUARIOS = 'USUARIOS',
}

export interface TrazabilityServiceParams {
    action: ActionsValues,
    module: ModuleValues,
    description: string
}

export interface TrazabilityMap extends TrazabilityServiceParams {
    id: string,
    createdAt: string,
    userId: string,
    buildingId: string,
}