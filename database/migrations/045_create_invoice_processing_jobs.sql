-- Cola de trabajos de procesamiento de facturas con IA (consumida por Redis/BullMQ)
-- Cada job se consulta por GET /ai/invoice-job/:id y al completar se envía notificación al usuario.

BEGIN;

CREATE TABLE IF NOT EXISTS invoice_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    document_url TEXT NOT NULL,
    document_filename TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
    extracted_data JSONB,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_processing_jobs_user_id ON invoice_processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_invoice_processing_jobs_building_id ON invoice_processing_jobs(building_id);
CREATE INDEX IF NOT EXISTS idx_invoice_processing_jobs_status ON invoice_processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_invoice_processing_jobs_created_at ON invoice_processing_jobs(created_at DESC);

COMMENT ON TABLE invoice_processing_jobs IS 'Jobs de procesamiento asíncrono de facturas con IA; la cola real está en Redis (BullMQ).';

COMMIT;
