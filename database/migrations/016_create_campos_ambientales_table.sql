-- Migration: 016_create_campos_ambientales_table.sql
-- Description: Create campos_ambientales table for ESG calculations
-- Date: 2025-01-27

-- Create campos_ambientales table
CREATE TABLE IF NOT EXISTS campos_ambientales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  
  -- Environmental (E) fields
  renewable_share_percent INTEGER CHECK (renewable_share_percent >= 0 AND renewable_share_percent <= 100),
  water_footprint_m3_per_m2_year DECIMAL(10,2) CHECK (water_footprint_m3_per_m2_year >= 0),
  
  -- Social (S) fields
  accessibility TEXT CHECK (accessibility IN ('full', 'partial', 'none')),
  indoor_air_quality_co2_ppm INTEGER CHECK (indoor_air_quality_co2_ppm >= 0),
  safety_compliance TEXT CHECK (safety_compliance IN ('full', 'pending', 'none')),
  
  -- Governance (G) fields
  regulatory_compliance_percent INTEGER CHECK (regulatory_compliance_percent >= 0 AND regulatory_compliance_percent <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint: one record per building
  UNIQUE(building_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_campos_ambientales_building_id ON campos_ambientales(building_id);

-- Enable RLS (Row Level Security)
ALTER TABLE campos_ambientales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy 1: Users can view campos_ambientales for buildings they have access to
CREATE POLICY "Users can view campos_ambientales for accessible buildings" ON campos_ambientales
  FOR SELECT USING (
    building_id IN (
      SELECT b.id FROM buildings b
      LEFT JOIN user_building_assignments uba ON b.id = uba.building_id
      LEFT JOIN profiles p ON uba.user_id = p.id
      WHERE 
        p.auth_id = auth.uid() OR
        b.owner_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    )
  );

-- Policy 2: Technicians can insert/update campos_ambientales for assigned buildings
CREATE POLICY "Technicians can manage campos_ambientales for assigned buildings" ON campos_ambientales
  FOR ALL USING (
    building_id IN (
      SELECT uba.building_id FROM user_building_assignments uba
      JOIN profiles p ON uba.user_id = p.id
      WHERE p.auth_id = auth.uid() AND p.role = 'tecnico'
    )
  );

-- Policy 3: System/Admin can manage all campos_ambientales
CREATE POLICY "Admins can manage all campos_ambientales" ON campos_ambientales
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.auth_id = auth.uid() 
      AND p.role IN ('administrador', 'cfo')
    )
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_campos_ambientales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_campos_ambientales_updated_at_trigger
  BEFORE UPDATE ON campos_ambientales
  FOR EACH ROW
  EXECUTE FUNCTION update_campos_ambientales_updated_at();

-- Add comments for documentation
COMMENT ON TABLE campos_ambientales IS 'Environmental, Social, and Governance (ESG) data for buildings';
COMMENT ON COLUMN campos_ambientales.renewable_share_percent IS 'Percentage of renewable energy (0-100)';
COMMENT ON COLUMN campos_ambientales.water_footprint_m3_per_m2_year IS 'Water footprint in m³/m²/year';
COMMENT ON COLUMN campos_ambientales.accessibility IS 'Accessibility level: full, partial, none';
COMMENT ON COLUMN campos_ambientales.indoor_air_quality_co2_ppm IS 'Indoor air quality in CO2 ppm';
COMMENT ON COLUMN campos_ambientales.safety_compliance IS 'Safety compliance level: full, pending, none';
COMMENT ON COLUMN campos_ambientales.regulatory_compliance_percent IS 'Regulatory compliance percentage (0-100)';
