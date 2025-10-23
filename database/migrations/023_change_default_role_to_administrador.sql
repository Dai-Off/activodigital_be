-- Migración para cambiar el rol por defecto de usuarios de 'propietario' a 'administrador'
-- Esto afecta tanto al trigger de la base de datos como a la función helper

BEGIN;

-- 1) Actualizar la función helper para obtener el rol de administrador
CREATE OR REPLACE FUNCTION public.get_default_role_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM roles WHERE name = 'administrador' LIMIT 1;
$$;

-- 2) Actualizar la función del trigger para usar administrador como rol por defecto
CREATE OR REPLACE FUNCTION public.set_default_user_role()
RETURNS trigger AS $$
DECLARE
  default_role_id uuid;
BEGIN
  IF NEW.role_id IS NULL THEN
    SELECT public.get_default_role_id() INTO default_role_id;
    IF default_role_id IS NULL THEN
      -- Si por alguna razón el rol no existe, crearlo ahora
      INSERT INTO roles (name, description)
      VALUES ('administrador', 'Usuario administrador con acceso completo al sistema')
      ON CONFLICT (name) DO NOTHING;
      SELECT public.get_default_role_id() INTO default_role_id;
    END IF;
    NEW.role_id = default_role_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Asegurarse de que el rol 'administrador' existe
INSERT INTO roles (name, description)
VALUES ('administrador', 'Usuario administrador con acceso completo al sistema')
ON CONFLICT (name) DO NOTHING;

COMMIT;
