-- Ensure roles are seeded and set default role to 'propietario' on users inserts
-- Safe to run multiple times (idempotent where possible)

BEGIN;

-- 1) Seed roles
INSERT INTO roles (name, description)
VALUES 
  ('propietario', 'Usuario propietario que puede crear edificios y asignar técnicos'),
  ('tecnico', 'Usuario técnico que gestiona libros digitales de edificios asignados'),
  ('administrador', 'Usuario administrador con acceso completo al sistema'),
  ('cfo', 'Usuario CFO con acceso a información financiera y reportes')
ON CONFLICT (name) DO NOTHING;

-- 2) Create helper function to fetch propietario role id
CREATE OR REPLACE FUNCTION public.get_propietario_role_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM roles WHERE name = 'propietario' LIMIT 1;
$$;

-- 3) Create BEFORE INSERT trigger on users to set default role to 'propietario' if not provided
CREATE OR REPLACE FUNCTION public.set_default_user_role()
RETURNS trigger AS $$
DECLARE
  propietario_id uuid;
BEGIN
  IF NEW.role_id IS NULL THEN
    SELECT public.get_propietario_role_id() INTO propietario_id;
    IF propietario_id IS NULL THEN
      -- If for some reason the role does not exist yet, create it now
      INSERT INTO roles (name, description)
      VALUES ('propietario', 'Usuario propietario que puede crear edificios y asignar técnicos')
      ON CONFLICT (name) DO NOTHING;
      SELECT public.get_propietario_role_id() INTO propietario_id;
    END IF;
    NEW.role_id = propietario_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_set_default_user_role'
  ) THEN
    CREATE TRIGGER trg_set_default_user_role
      BEFORE INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION public.set_default_user_role();
  END IF;
END $$;

COMMIT;


