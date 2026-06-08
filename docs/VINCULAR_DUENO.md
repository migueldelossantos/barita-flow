# Vincular dueño del negocio con su empresa

La app identifica al negocio por la tabla **`company_members`**: une el `user_id` de Supabase Auth (login con Google) con el `company_id` de la empresa.

Sin ese registro, el dueño puede iniciar sesión pero **no verá productos, pedidos ni configuración** de su negocio.

## Flujo recomendado (orden correcto)

### Paso 1 — Dueño: primer acceso con Google

1. Abre `http://localhost:3000/admin` (o tu dominio).
2. Clic en **Continuar con Google**.
3. Completa el login.

Esto crea el usuario en **Supabase Auth**. El correo debe ser el mismo que usarás para vincular (ej. `dueño@gmail.com`).

### Paso 2 — Super Admin: crear el negocio

1. Entra a `/super-admin` (cuenta en tabla `system_admins`).
2. **Nuevo negocio**: nombre, teléfono, licencia DEMO o RENTA.
3. Opcional al crear: campo **Email del dueño** con el mismo Gmail del paso 1.
   - Si ese usuario **ya existía** en Auth, se vincula automáticamente.
   - Si aún no había entrado, la vinculación automática **no ocurre** (hay que hacer el paso 3).

### Paso 3 — Super Admin: vincular dueño (si hace falta)

En la tabla de empresas, columna **Vincular dueño**:

1. Escribe el correo exacto del dueño (`dueño@gmail.com`).
2. Pulsa **OK**.

Requisito: ese correo debe existir en Auth (el dueño debió iniciar sesión al menos una vez).

### Paso 4 — Dueño: usar el panel

1. Recarga la página o cierra sesión y vuelve a entrar.
2. En **Mi perfil** debe aparecer **Negocio vinculado: [nombre]**.
3. Si `is_setup_complete` es `false`, irá a **Configuración inicial** (`/admin/setup`).
4. Luego categorías y dashboard con todas las funciones.

## Vinculación manual en SQL (alternativa)

En Supabase → SQL Editor:

```sql
-- IDs de ejemplo: sustituye por los reales
INSERT INTO company_members (company_id, user_id, role)
VALUES (
  '00000000-0000-4000-8000-000000000001',  -- UUID de companies
  'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',  -- UUID de auth.users
  'owner'
)
ON CONFLICT (company_id, user_id) DO NOTHING;
```

Obtener `user_id`:

```sql
SELECT id, email FROM auth.users WHERE email = 'dueño@gmail.com';
```

## Cómo lo detecta la aplicación

| Componente | Qué hace |
|------------|----------|
| `CompanyProvider` | Tras login, busca `company_members` por `user_id` y carga la empresa |
| RLS (`is_company_member`) | Solo permite editar datos de esa empresa |
| Menú cliente | URL `/menu/{company_id}` — el UUID es el de `companies.id` |

## Errores frecuentes

| Problema | Solución |
|----------|----------|
| "Usuario no encontrado" al vincular | El dueño debe iniciar sesión con Google **antes** de vincular |
| Panel vacío / sin datos | Falta fila en `company_members` o correo distinto al de Google |
| Super Admin en lugar del panel del negocio | Ese usuario está en `system_admins`; el dueño del local no debe estar ahí salvo que administre todo el sistema |
| `SUPABASE_SERVICE_ROLE_KEY` | Obligatoria en `.env.local` para crear empresas y vincular desde Super Admin |

## Enlace del menú para clientes

Tras crear la empresa, el menú público es:

```
https://tu-dominio.com/menu/{company_id}
```

Copia el UUID desde Super Admin (**QR / Link**) o desde **Mi empresa** en el panel del dueño.
