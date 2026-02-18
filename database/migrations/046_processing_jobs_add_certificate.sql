-- Unificar jobs de facturas y certificados en la misma tabla.
-- job_type: 'invoice' | 'certificate'. Para certificados se usa document_url como image_url
-- y se añaden columnas opcionales (storage_path, etc.).

BEGIN;

ALTER TABLE invoice_processing_jobs
  ADD COLUMN IF NOT EXISTS job_type VARCHAR(20) NOT NULL DEFAULT 'invoice'
    CHECK (job_type IN ('invoice', 'certificate'));

ALTER TABLE invoice_processing_jobs
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS storage_file_name TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

CREATE INDEX IF NOT EXISTS idx_invoice_processing_jobs_job_type ON invoice_processing_jobs(job_type);

COMMENT ON TABLE invoice_processing_jobs IS 'Jobs de procesamiento asíncrono (facturas y certificados energéticos) con IA; la cola real está en Redis (BullMQ).';

COMMIT;
