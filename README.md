# BaristaFlow

SPA multi-negocio para pedidos en línea. Stack: **Next.js 14**, **TypeScript**, **Tailwind CSS**, **Supabase** (PostgreSQL + Auth).

## Arquitectura

```
src/
  domain/          # Entidades y enums (sin dependencias externas)
  application/     # Casos de uso (próximas iteraciones)
  infrastructure/  # Supabase, repositorios
  presentation/    # Componentes UI y stores (Zustand)
  app/             # Rutas App Router
supabase/
  migrations/      # Esquema PostgreSQL + RLS
  seed.sql         # Datos demo
```

## Menú del cliente (mobile-first)

Cada negocio tiene un UUID único. El cliente accede por:

```
https://tu-dominio.com/menu/{company-uuid}
```

Demo local (después del seed):

```
http://localhost:3000/menu/00000000-0000-4000-8000-000000000001
```

Flujo implementado:

- Modal inicial de método de entrega
- Banner colapsable al hacer scroll
- Búsqueda y filtros por categoría
- Más vendidos
- Detalle de producto con toppings y extras
- Carrito y checkout en 3 pasos
- Envío por WhatsApp (`wa.me`) + registro del pedido en Supabase

## Configuración de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, ejecuta `supabase/migrations/20240528000000_initial_schema.sql`.
3. Opcional: ejecuta `supabase/seed.sql` para datos demo.
4. En **Authentication → Providers**, habilita **Google** y configura redirect URLs:
   - `http://localhost:3000/auth/callback`
5. Copia `.env.example` a `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Desarrollo

```bash
npm install
npm run dev
```

## Licencias y multi-tenant

Tabla `companies`: `license_type` (`DEMO` | `RENTA`), `license_expires_at` (1 mes por defecto). El dueño del sistema da de alta negocios con nombre y teléfono; el negocio completa perfil tras login con Google.

## Panel de administración

Tras login con Google (`/admin`):

| Ruta | Función |
|------|---------|
| `/admin/dashboard` | Ventas semanales + top 10 productos |
| `/admin/dashboard/products` | CRUD con modal, toppings, imágenes |
| `/admin/dashboard/categories` | CRUD categorías |
| `/admin/dashboard/orders` | Pedidos, avance de estatus, imprimir ticket, realtime |
| `/admin/dashboard/company` | Perfil, logos, licencia, enlace del menú |
| `/super-admin` | Alta de negocios, licencias DEMO/RENTA, vincular dueños |

### Migraciones adicionales

Ejecuta en orden:

1. `supabase/migrations/20240528100000_admin_features.sql`
2. `supabase/migrations/20240528110000_member_company_update.sql`

En Supabase → **Database → Replication**, confirma que `orders` está en Realtime.

### Super Admin

1. Añade `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`
2. Inicia sesión con Google una vez
3. Ejecuta `supabase/scripts/add-system-admin.sql` con tu email
4. Accede a `/super-admin`

### Storage

Bucket `company-assets` (público). Rutas: `{companyId}/logo|banner|products/...`

## Nota sobre WhatsApp

El enlace `wa.me` abre WhatsApp con el mensaje prellenado. El envío lo confirma el usuario en la app de WhatsApp; no es posible enviar mensajes automáticamente desde el navegador sin la API oficial de Meta Business.
