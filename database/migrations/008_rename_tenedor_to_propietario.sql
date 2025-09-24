-- Rename role name from 'tenedor' to 'propietario'
-- Safe to run multiple times

BEGIN;

-- 1) Update roles table value
UPDATE roles
SET name = 'propietario',
    updated_at = NOW(),
    description = COALESCE(description, 'Usuario propietario que puede crear edificios y asignar técnicos')
WHERE name = 'tenedor';

-- 2) If an enum user_role exists, rename the enum value
DO $$
DECLARE
  enum_exists BOOLEAN;
  value_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_namespace n ON n.oid = t.typnamespace 
    WHERE t.typname = 'user_role'
  ) INTO enum_exists;

  IF enum_exists THEN
    -- Check if value 'tenedor' exists in the enum
    SELECT EXISTS (
      SELECT 1 FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = 'user_role' AND e.enumlabel = 'tenedor'
    ) INTO value_exists;

    IF value_exists THEN
      EXECUTE 'ALTER TYPE user_role RENAME VALUE ''tenedor'' TO ''propietario''';
    END IF;
  END IF;
END $$;

-- 3) Optional: update comments mentioning "tenedor" in columns
COMMENT ON COLUMN buildings.owner_id IS 'ID del usuario propietario (propietario) del edificio';

COMMIT;


