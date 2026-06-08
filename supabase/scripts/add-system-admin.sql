-- Ejecutar después de que el dueño del sistema inicie sesión con Google al menos una vez.
-- Reemplaza el email por el tuyo.

INSERT INTO system_admins (user_id)
SELECT id FROM auth.users WHERE email = 'tu-email@gmail.com'
ON CONFLICT (user_id) DO NOTHING;
