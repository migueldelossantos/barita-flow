"use client";

import { createClient } from "@/infrastructure/supabase/client";
import { useState } from "react";
import { Button } from "../ui/Button";

export function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    setError("No se pudo iniciar el flujo de Google. Revisa la configuración en Supabase.");
    setLoading(false);
  };

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <Button
        variant="blue"
        size="lg"
        fullWidth
        type="button"
        disabled={loading}
        onClick={handleLogin}
      >
        {loading ? "Redirigiendo..." : "Continuar con Google"}
      </Button>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
