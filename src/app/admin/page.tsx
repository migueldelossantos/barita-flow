import { GoogleLoginButton } from "@/presentation/components/admin/GoogleLoginButton";
import Link from "next/link";

const ERROR_MESSAGES: Record<string, string> = {
  auth: "No se pudo iniciar sesión. Revisa Google OAuth en Supabase.",
  config: "Faltan variables NEXT_PUBLIC_SUPABASE_URL o ANON_KEY en .env.local",
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  const errorKey = searchParams.error;
  const errorText =
    searchParams.message ??
    (errorKey ? ERROR_MESSAGES[errorKey] : null);

  const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
    "https://",
    ""
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">Panel del negocio</h1>
      <p className="max-w-sm text-center text-sm text-gray-600">
        Inicia sesión con Google para administrar productos, pedidos y tu
        empresa.
      </p>

      {errorText && (
        <div className="max-w-sm rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {errorText}
        </div>
      )}

      <GoogleLoginButton />

      <details className="max-w-md text-left text-sm text-gray-600">
        <summary className="cursor-pointer text-brand-blue">
          ¿Error al iniciar con Google?
        </summary>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            Supabase → Authentication → <strong>Providers → Google</strong>:
            activar y pegar Client ID / Secret.
          </li>
          <li>
            Google Cloud → URI de redirección (no localhost):
            <code className="mt-1 block break-all rounded bg-gray-100 px-2 py-1 text-xs">
              https://{supabaseHost ?? "TU-PROYECTO.supabase.co"}
              /auth/v1/callback
            </code>
          </li>
          <li>
            Supabase → URL Configuration: Site URL{" "}
            <code className="text-xs">http://localhost:3000</code> y Redirect{" "}
            <code className="text-xs">http://localhost:3000/auth/callback</code>
          </li>
        </ol>
        <p className="mt-2">
          Guía completa:{" "}
          <code className="text-xs">docs/AUTH_GOOGLE.md</code>
        </p>
      </details>

      <Link href="/" className="text-sm text-gray-500 underline">
        Volver al inicio
      </Link>
    </main>
  );
}
