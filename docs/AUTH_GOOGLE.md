# Configurar Google OAuth con Supabase

Si al hacer clic en **Continuar con Google** ves una página de error en  
`https://TU-PROYECTO.supabase.co/auth/v1/authorize?...`  
el problema casi siempre es la **configuración en Supabase o Google Cloud**, no el código de la app.

## 1. Supabase → Authentication → Providers → Google

1. Activa el interruptor **Enable Sign in with Google**.
2. Necesitas **Client ID** y **Client Secret** de Google (paso 2).
3. Copia la **Callback URL** que muestra Supabase. Debe ser exactamente:

   ```
   https://wyrvlvvdemvjcvexaups.supabase.co/auth/v1/callback
   ```

   (usa la de tu proyecto; la del ejemplo es la tuya según la URL que compartiste)

4. Guarda los cambios.

### Errores típicos en esta pantalla

| Mensaje / síntoma | Causa |
|-------------------|--------|
| Provider not enabled | Google no está activado en Supabase |
| Invalid client | Client ID o Secret incorrectos en Supabase |
| redirect_uri_mismatch | La URI de callback en Google no coincide con la de Supabase |

---

## 2. Google Cloud Console

1. Entra a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea o elige un proyecto.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**.
4. Tipo de aplicación: **Aplicación web**.

### Orígenes autorizados de JavaScript

```
http://localhost:3000
```

(Añade tu dominio de producción cuando despliegues.)

### URIs de redireccionamiento autorizados

**Importante:** aquí va la callback de **Supabase**, no la de tu app:

```
https://wyrvlvvdemvjcvexaups.supabase.co/auth/v1/callback
```

No uses `http://localhost:3000/auth/callback` en Google; Supabase recibe el callback y luego redirige a tu app.

5. Copia **Client ID** y **Client secret** → pégalos en Supabase (paso 1).

6. Si la app está en modo **Testing**, en **Pantalla de consentimiento de OAuth** agrega tu correo como **usuario de prueba**.

---

## 3. Supabase → Authentication → URL Configuration

| Campo | Valor local |
|--------|-------------|
| **Site URL** | `http://localhost:3000` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` |

Puedes añadir también:

```
http://localhost:3000/**
```

Guarda cambios.

---

## 4. Variables en `.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=https://wyrvlvvdemvjcvexaups.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...   # anon public, no service_role
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Reinicia el servidor después de cambiar el `.env`:

```bash
npm run dev
```

---

## 5. Comprobar el flujo

1. Abre `http://localhost:3000/admin`
2. Clic en **Continuar con Google**
3. Deberías ir a **accounts.google.com** (no quedarte en error en supabase.co)
4. Tras aceptar, vuelves a `http://localhost:3000/auth/callback` y luego al dashboard

---

## 6. Super Admin (opcional)

Después del primer login exitoso, en SQL Editor:

```sql
INSERT INTO system_admins (user_id)
SELECT id FROM auth.users WHERE email = 'tu@gmail.com'
ON CONFLICT DO NOTHING;
```
