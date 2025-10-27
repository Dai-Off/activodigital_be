-- Crear tabla para almacenar los snapshots financieros del CFO
CREATE TABLE IF NOT EXISTS financial_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
    
    -- Periodo financiero
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    
    -- Revenue (Ingresos)
    gross_annual_revenue_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    other_annual_revenue_eur NUMERIC(12, 2),
    walt_months INTEGER NOT NULL DEFAULT 0,
    top_tenant_concentration_pct NUMERIC(5, 4) NOT NULL DEFAULT 0,
    has_indexation_clause BOOLEAN,
    delinquency_rate_12m NUMERIC(5, 4),
    
    -- OPEX
    total_annual_opex_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    annual_energy_opex_eur NUMERIC(12, 2) NOT NULL DEFAULT 0,
    annual_maintenance_opex_eur NUMERIC(12, 2),
    annual_insurance_opex_eur NUMERIC(12, 2),
    annual_other_opex_eur NUMERIC(12, 2),
    
    -- Debt
    dscr NUMERIC(8, 2),
    annual_debt_service_eur NUMERIC(12, 2),
    has_high_prepayment_penalty BOOLEAN,
    outstanding_principal_eur NUMERIC(12, 2),
    
    -- Rehabilitation
    estimated_rehab_capex_eur NUMERIC(12, 2),
    estimated_energy_savings_pct NUMERIC(5, 2),
    estimated_price_uplift_pct NUMERIC(5, 2),
    estimated_rehab_duration_weeks INTEGER,
    
    -- Additional metadata
    meta JSONB DEFAULT '{}',
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: solo un snapshot por edificio y periodo (facilita updates)
    UNIQUE(building_id, period_start, period_end)
);

-- Índices
CREATE INDEX idx_financial_snapshots_building_id ON financial_snapshots(building_id);
CREATE INDEX idx_financial_snapshots_period ON financial_snapshots(period_start, period_end);
CREATE INDEX idx_financial_snapshots_created_at ON financial_snapshots(created_at);

-- Trigger para updated_at
CREATE TRIGGER update_financial_snapshots_updated_at 
    BEFORE UPDATE ON financial_snapshots 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE financial_snapshots ENABLE ROW LEVEL SECURITY;

-- Política: propietarios y técnicos asignados pueden ver los snapshots del edificio
CREATE POLICY financial_snapshots_access_policy ON financial_snapshots
    FOR SELECT USING (
        -- El propietario puede ver
        EXISTS (
            SELECT 1 FROM buildings b
            JOIN users u ON u.id = b.owner_id
            WHERE u.user_id = auth.uid() 
            AND b.id = financial_snapshots.building_id
        )
        OR
        -- El técnico asignado puede ver
        EXISTS (
            SELECT 1 FROM building_technician_assignments bta
            JOIN users u ON u.id = bta.technician_id
            WHERE u.user_id = auth.uid() 
            AND bta.building_id = financial_snapshots.building_id 
            AND bta.status = 'active'
        )
        OR
        -- El CFO asignado puede ver y escribir
        EXISTS (
            SELECT 1 FROM building_cfo_assignments bca
            JOIN users u ON u.id = bca.cfo_id
            WHERE u.user_id = auth.uid() 
            AND bca.building_id = financial_snapshots.building_id 
            AND bca.status = 'active'
        )
    );

-- Política: solo CFOs asignados pueden insertar/actualizar
CREATE POLICY financial_snapshots_write_policy ON financial_snapshots
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM building_cfo_assignments bca
            JOIN users u ON u.id = bca.cfo_id
            WHERE u.user_id = auth.uid() 
            AND bca.building_id = financial_snapshots.building_id 
            AND bca.status = 'active'
        )
    );

-- Comentarios
COMMENT ON TABLE financial_snapshots IS 'Almacena los snapshots financieros cargados por el CFO';
COMMENT ON COLUMN financial_snapshots.period_start IS 'Inicio del periodo financiero';
COMMENT ON COLUMN financial_snapshots.period_end IS 'Fin del periodo financiero';
COMMENT ON COLUMN financial_snapshots.meta IS 'Metadata adicional (documentación, mercado, etc.)';

