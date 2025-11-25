// acciones que se van a hacer sobre los modulos, esto con el fin de facilitar los iconos
export enum ActionsValues {
    CREAR = 'CREAR',
    ACTUALIZAR = 'ACTUALIZAR',
    ELIMINAR = 'ELIMINAR',
    APROBAR = 'APROBAR',
    RECHAZAR = 'RECHAZAR',
    COMPLETAR = 'COMPLETAR',
    SUBIR = 'SUBIR',
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
    buildingId: string,
    authUserId: string,
}


// Interfaz para mapeo al de datos de respuesta del objeto
export interface TrazabilityMap extends TrazabilityServiceParams {
    id: string,
    createdAt: string,
    authUserId: string,
    buildingId: string,
}

// INTEGRACIONES EN LOS SERVICIOS DE LA APP
/*
    !IMPLEMENTACIÓN RÁPIDA

    ? DECLARACIÓN.
    private trazabilityService = new TrazabilityService()

    ? MÉTODO DENTRO DEL SERVICIO.
    async insertTrazability(data: TrazabilityServiceParams) {
        await this.trazabilityService.registerTrazability(data);
    }
*/

