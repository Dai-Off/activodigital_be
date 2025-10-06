"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateEnergeticoService = void 0;
const supabase_1 = require("../../lib/supabase");
const certificateEnergetico_1 = require("../../types/certificateEnergetico");
class CertificateEnergeticoService {
    getSupabase() {
        return (0, supabase_1.getSupabaseClient)();
    }
    // Mapear datos de BD a tipo EnergyCertificateSession
    mapDbToEnergyCertificateSession(dbSession) {
        return {
            id: dbSession.id,
            buildingId: dbSession.building_id,
            kind: dbSession.kind,
            status: dbSession.status,
            documents: dbSession.documents,
            extractedData: dbSession.extracted_data,
            editedData: dbSession.edited_data,
            reviewerUserId: dbSession.reviewer_user_id,
            errorMessage: dbSession.error_message,
            userId: dbSession.user_id,
            createdAt: dbSession.created_at,
            updatedAt: dbSession.updated_at
        };
    }
    // Mapear datos de BD a tipo EnergyCertificate
    mapDbToEnergyCertificate(dbCert) {
        // DEBUG: Ver qué está recibiendo el mapeo
        console.log('🔍 Mapeando certificado desde BD:', JSON.stringify(dbCert, null, 2));
        return {
            id: dbCert.id,
            buildingId: dbCert.building_id,
            kind: dbCert.kind,
            rating: dbCert.rating,
            primaryEnergyKwhPerM2Year: dbCert.primary_energy_kwh_per_m2_year,
            emissionsKgCo2PerM2Year: dbCert.emissions_kg_co2_per_m2_year,
            certificateNumber: dbCert.certificate_number,
            scope: dbCert.scope,
            issuerName: dbCert.issuer_name,
            issueDate: dbCert.issue_date,
            expiryDate: dbCert.expiry_date,
            propertyReference: dbCert.property_reference,
            notes: dbCert.notes,
            sourceDocumentUrl: dbCert.source_document_url || null,
            sourceSessionId: dbCert.source_session_id,
            // Campos de imagen
            imageUrl: dbCert.image_url || null,
            imageFilename: dbCert.image_filename || null,
            imageUploadedAt: dbCert.image_uploaded_at || null,
            userId: dbCert.user_id,
            createdAt: dbCert.created_at,
            updatedAt: dbCert.updated_at
        };
    }
    /**
     * Crear sesión de certificado energético con documentos
     */
    async createEnergyCertificateSession(data, userAuthId) {
        const supabase = this.getSupabase();
        // Crear documentos primero
        const documentIds = [];
        for (const docData of data.documents) {
            const { data: doc, error: docError } = await supabase
                .from('energy_certificate_documents')
                .insert({
                building_id: data.buildingId,
                filename: docData.filename,
                url: docData.url,
                mime_type: docData.mimeType,
                uploaded_at: docData.uploadedAt,
                user_id: userAuthId
            })
                .select()
                .single();
            if (docError) {
                throw new Error(`Error creando documento: ${docError.message}`);
            }
            documentIds.push(doc.id);
        }
        // Crear sesión
        const { data: session, error: sessionError } = await supabase
            .from('energy_certificate_sessions')
            .insert({
            building_id: data.buildingId,
            kind: data.kind,
            status: certificateEnergetico_1.AIExtractionStatus.UPLOADED,
            documents: documentIds,
            user_id: userAuthId
        })
            .select(`
        id,
        building_id,
        kind,
        status,
        documents,
        extracted_data,
        edited_data,
        reviewer_user_id,
        error_message,
        user_id,
        created_at,
        updated_at
      `)
            .single();
        if (sessionError) {
            throw new Error(`Error creando sesión: ${sessionError.message}`);
        }
        return this.mapDbToEnergyCertificateSession(session);
    }
    /**
     * Actualizar sesión de certificado energético (para extracción por IA)
     */
    async updateEnergyCertificateSession(sessionId, data, userAuthId) {
        const supabase = this.getSupabase();
        // Verificar que la sesión pertenece al usuario
        const { data: existingSession, error: fetchError } = await supabase
            .from('energy_certificate_sessions')
            .select('id, user_id')
            .eq('id', sessionId)
            .eq('user_id', userAuthId)
            .single();
        if (fetchError || !existingSession) {
            throw new Error('Sesión no encontrada o sin permisos');
        }
        const updateData = {};
        if (data.status !== undefined)
            updateData.status = data.status;
        if (data.extractedData !== undefined)
            updateData.extracted_data = data.extractedData;
        if (data.editedData !== undefined)
            updateData.edited_data = data.editedData;
        if (data.errorMessage !== undefined)
            updateData.error_message = data.errorMessage;
        const { data: session, error: updateError } = await supabase
            .from('energy_certificate_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .select(`
        id,
        building_id,
        kind,
        status,
        documents,
        extracted_data,
        edited_data,
        reviewer_user_id,
        error_message,
        user_id,
        created_at,
        updated_at
      `)
            .single();
        if (updateError) {
            throw new Error(`Error actualizando sesión: ${updateError.message}`);
        }
        return this.mapDbToEnergyCertificateSession(session);
    }
    /**
     * Obtener URL del documento principal de una sesión
     */
    async getPrimaryDocumentUrl(sessionId) {
        const supabase = this.getSupabase();
        // Primero obtener los IDs de documentos de la sesión
        const { data: session, error: sessionError } = await supabase
            .from('energy_certificate_sessions')
            .select('documents')
            .eq('id', sessionId)
            .single();
        if (sessionError || !session?.documents || session.documents.length === 0) {
            return null;
        }
        // Obtener el primer documento (principal)
        const { data: document, error: docError } = await supabase
            .from('energy_certificate_documents')
            .select('url')
            .eq('id', session.documents[0])
            .single();
        if (docError || !document) {
            return null;
        }
        return document.url;
    }
    /**
     * Confirmar certificado energético y guardarlo definitivamente
     */
    async confirmEnergyCertificate(data, userAuthId) {
        console.log('🚀 INICIO confirmEnergyCertificate - Datos recibidos:', JSON.stringify(data, null, 2));
        const supabase = this.getSupabase();
        // Obtener la sesión
        const { data: session, error: sessionError } = await supabase
            .from('energy_certificate_sessions')
            .select('*')
            .eq('id', data.sessionId)
            .eq('user_id', userAuthId)
            .single();
        if (sessionError || !session) {
            throw new Error('Sesión no encontrada o sin permisos');
        }
        // Validar que los datos requeridos estén presentes
        const requiredFields = ['rating', 'primaryEnergyKwhPerM2Year', 'emissionsKgCo2PerM2Year', 'certificateNumber', 'issuerName', 'issueDate', 'expiryDate'];
        const missingFields = requiredFields.filter(field => !data.finalData[field]);
        if (missingFields.length > 0) {
            throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        }
        // Crear certificado energético
        const { data: certificate, error: certError } = await supabase
            .from('energy_certificates')
            .insert({
            building_id: session.building_id,
            kind: session.kind,
            rating: data.finalData.rating,
            primary_energy_kwh_per_m2_year: data.finalData.primaryEnergyKwhPerM2Year,
            emissions_kg_co2_per_m2_year: data.finalData.emissionsKgCo2PerM2Year,
            certificate_number: data.finalData.certificateNumber,
            scope: data.finalData.scope || session.kind,
            issuer_name: data.finalData.issuerName,
            issue_date: data.finalData.issueDate,
            expiry_date: data.finalData.expiryDate,
            property_reference: data.finalData.propertyReference,
            notes: data.finalData.notes,
            source_session_id: data.sessionId,
            // Campos de imagen
            image_url: data.finalData.imageUrl,
            image_filename: data.finalData.imageFilename,
            image_uploaded_at: data.finalData.imageUploadedAt ? new Date(data.finalData.imageUploadedAt) : null,
            user_id: userAuthId
        })
            .select(`
        id,
        building_id,
        kind,
        rating,
        primary_energy_kwh_per_m2_year,
        emissions_kg_co2_per_m2_year,
        certificate_number,
        scope,
        issuer_name,
        issue_date,
        expiry_date,
        property_reference,
        notes,
        source_session_id,
        image_url,
        image_filename,
        image_uploaded_at,
        user_id,
        created_at,
        updated_at
      `)
            .single();
        if (certError) {
            throw new Error(`Error creando certificado: ${certError.message}`);
        }
        // DEBUG: Ver qué está devolviendo la BD
        console.log('🔍 Certificado creado en BD:', JSON.stringify(certificate, null, 2));
        // Actualizar estado de la sesión a confirmado
        await supabase
            .from('energy_certificate_sessions')
            .update({
            status: certificateEnergetico_1.AIExtractionStatus.CONFIRMED,
            edited_data: data.finalData,
            reviewer_user_id: session.user_id
        })
            .eq('id', data.sessionId);
        return this.mapDbToEnergyCertificate(certificate);
    }
    /**
     * Obtener sesiones y certificados de un edificio
     */
    async getEnergyCertificatesByBuilding(buildingId, userAuthId) {
        const supabase = this.getSupabase();
        // Obtener sesiones
        const { data: sessions, error: sessionsError } = await supabase
            .from('energy_certificate_sessions')
            .select(`
        id,
        building_id,
        kind,
        status,
        documents,
        extracted_data,
        edited_data,
        reviewer_user_id,
        error_message,
        user_id,
        created_at,
        updated_at
      `)
            .eq('building_id', buildingId)
            .eq('user_id', userAuthId)
            .order('created_at', { ascending: false });
        if (sessionsError) {
            throw new Error(`Error obteniendo sesiones: ${sessionsError.message}`);
        }
        // Obtener certificados confirmados
        const { data: certificates, error: certificatesError } = await supabase
            .from('energy_certificates')
            .select(`
        id,
        building_id,
        kind,
        rating,
        primary_energy_kwh_per_m2_year,
        emissions_kg_co2_per_m2_year,
        certificate_number,
        scope,
        issuer_name,
        issue_date,
        expiry_date,
        property_reference,
        notes,
        source_session_id,
        image_url,
        image_filename,
        image_uploaded_at,
        user_id,
        created_at,
        updated_at
      `)
            .eq('building_id', buildingId)
            .eq('user_id', userAuthId)
            .order('created_at', { ascending: false });
        if (certificatesError) {
            throw new Error(`Error obteniendo certificados: ${certificatesError.message}`);
        }
        return {
            sessions: sessions.map(s => this.mapDbToEnergyCertificateSession(s)),
            certificates: certificates.map(c => this.mapDbToEnergyCertificate(c))
        };
    }
    /**
     * Obtener certificados energéticos de todos los edificios del usuario
     */
    async getAllEnergyCertificatesForUser(userAuthId) {
        const supabase = this.getSupabase();
        const { data: certificates, error } = await supabase
            .from('energy_certificates')
            .select(`
        id,
        building_id,
        kind,
        rating,
        primary_energy_kwh_per_m2_year,
        emissions_kg_co2_per_m2_year,
        certificate_number,
        scope,
        issuer_name,
        issue_date,
        expiry_date,
        property_reference,
        notes,
        source_session_id,
        image_url,
        image_filename,
        image_uploaded_at,
        user_id,
        created_at,
        updated_at,
        buildings!inner(name, address)
      `)
            .eq('user_id', userAuthId)
            .order('created_at', { ascending: false });
        if (error) {
            throw new Error(`Error obteniendo certificados: ${error.message}`);
        }
        return certificates.map(c => this.mapDbToEnergyCertificate(c));
    }
    /**
     * Eliminar sesión de certificado energético
     */
    async deleteEnergyCertificateSession(sessionId, userAuthId) {
        const supabase = this.getSupabase();
        // Verificar que la sesión pertenece al usuario
        const { data: session, error: sessionError } = await supabase
            .from('energy_certificate_sessions')
            .select('documents, user_id')
            .eq('id', sessionId)
            .eq('user_id', userAuthId)
            .single();
        if (sessionError || !session) {
            throw new Error('Sesión no encontrada o sin permisos');
        }
        // Eliminar documentos asociados
        if (session.documents && session.documents.length > 0) {
            const { error: docsError } = await supabase
                .from('energy_certificate_documents')
                .delete()
                .in('id', session.documents);
            if (docsError) {
                throw new Error(`Error eliminando documentos: ${docsError.message}`);
            }
        }
        // Eliminar sesión
        const { error: deleteError } = await supabase
            .from('energy_certificate_sessions')
            .delete()
            .eq('id', sessionId);
        if (deleteError) {
            throw new Error(`Error eliminando sesión: ${deleteError.message}`);
        }
    }
    /**
     * Eliminar certificado energético confirmado
     */
    async deleteEnergyCertificate(certificateId, userAuthId) {
        const supabase = this.getSupabase();
        const { error } = await supabase
            .from('energy_certificates')
            .delete()
            .eq('id', certificateId)
            .eq('user_id', userAuthId);
        if (error) {
            throw new Error(`Error eliminando certificado: ${error.message}`);
        }
    }
    /**
     * Obtener documentos de una sesión específica
     */
    async getSessionDocuments(sessionId, userAuthId) {
        const supabase = this.getSupabase();
        // Verificar que la sesión pertenece al usuario
        const { data: session, error: sessionError } = await supabase
            .from('energy_certificate_sessions')
            .select('documents, user_id')
            .eq('id', sessionId)
            .eq('user_id', userAuthId)
            .single();
        if (sessionError || !session) {
            throw new Error('Sesión no encontrada o sin permisos');
        }
        if (!session.documents || session.documents.length === 0) {
            return [];
        }
        // Obtener documentos
        const { data: documents, error: docsError } = await supabase
            .from('energy_certificate_documents')
            .select(`
        id,
        building_id,
        kind,
        filename,
        url,
        mime_type,
        uploaded_at,
        user_id
      `)
            .in('id', session.documents);
        if (docsError) {
            throw new Error(`Error obteniendo documentos: ${docsError.message}`);
        }
        return documents.map(doc => ({
            id: doc.id,
            buildingId: doc.building_id,
            kind: doc.kind,
            filename: doc.filename,
            url: doc.url,
            mimeType: doc.mime_type,
            uploadedAt: doc.uploaded_at,
            userId: doc.user_id
        }));
    }
}
exports.CertificateEnergeticoService = CertificateEnergeticoService;
//# sourceMappingURL=certificateEnergeticoService.js.map