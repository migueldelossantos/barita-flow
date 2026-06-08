"use client";

import { saveCategory } from "@/app/actions/admin";
import { saveCompanyProfile } from "@/app/actions/admin";
import { cn } from "@/lib/cn";
import { createClient } from "@/infrastructure/supabase/client";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { Check, Circle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/Button";
import { CategoryFormModal } from "./CategoryFormModal";

const SUGGESTED = [
  { name: "Principal", short: "principal", description: "Platillos principales" },
  { name: "Snacks", short: "snacks", description: "Botanas y acompañamientos" },
  { name: "Refrescos", short: "refrescos", description: "Bebidas frías" },
  { name: "Bebidas calientes", short: "bebidas", description: "Café, té y más" },
];

interface SavedCategory {
  id: string;
  name: string;
  shortName: string;
  description: string | null;
}

export function SetupCategoriesClient() {
  const { companyId, company } = useCompany();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [categories, setCategories] = useState<SavedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name, short_name, description")
      .eq("company_id", companyId)
      .order("sort_order");

    setCategories(
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        shortName: c.short_name,
        description: c.description,
      }))
    );
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const isSuggestedAdded = useCallback(
    (short: string, name: string) =>
      categories.some(
        (c) =>
          c.shortName.toLowerCase() === short.toLowerCase() ||
          c.name.toLowerCase() === name.toLowerCase()
      ),
    [categories]
  );

  const { addedSuggested, pendingSuggested } = useMemo(() => {
    const added = SUGGESTED.filter((s) => isSuggestedAdded(s.short, s.name));
    const pending = SUGGESTED.filter((s) => !isSuggestedAdded(s.short, s.name));
    return { addedSuggested: added, pendingSuggested: pending };
  }, [isSuggestedAdded]);

  const customCategories = useMemo(
    () =>
      categories.filter(
        (c) =>
          !SUGGESTED.some(
            (s) =>
              s.short.toLowerCase() === c.shortName.toLowerCase() ||
              s.name.toLowerCase() === c.name.toLowerCase()
          )
      ),
    [categories]
  );

  if (!companyId) {
    return <p className="p-6">Sin empresa vinculada.</p>;
  }

  const addSuggested = async (name: string, short: string) => {
    setAdding(short);
    try {
      await saveCategory(companyId, {
        name,
        shortName: short,
        description: "",
      });
      await loadCategories();
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo agregar");
    } finally {
      setAdding(null);
    }
  };

  const finish = async () => {
    if (categories.length === 0) {
      alert("Agrega al menos una categoría antes de continuar.");
      return;
    }
    if (company) {
      await saveCompanyProfile(companyId, {
        name: company.name,
        slogan: company.profile?.slogan ?? "",
        address: company.profile?.address ?? "",
        whatsappPhone: company.profile?.whatsappPhone ?? company.phone,
        logoUrl: company.profile?.logoUrl ?? null,
        bannerUrl: company.profile?.bannerUrl ?? null,
        transferOwnerName: company.profile?.transferOwnerName ?? "",
        transferBank: company.profile?.transferBank ?? "",
        transferClabe: company.profile?.transferClabe ?? "",
        isSetupComplete: true,
      });
    }
    router.push("/admin/dashboard");
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Categorías</h1>
        <p className="mt-1 text-sm text-gray-600">
          Agrega las categorías de tu menú. Las sugeridas son un atajo; también
          puedes crear las tuyas.
        </p>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg border bg-white px-3 py-3 shadow-sm">
          <p className="text-2xl font-bold text-brand-green">{categories.length}</p>
          <p className="text-gray-500">Agregadas</p>
        </div>
        <div className="rounded-lg border bg-white px-3 py-3 shadow-sm">
          <p className="text-2xl font-bold text-brand-blue">
            {addedSuggested.length}/{SUGGESTED.length}
          </p>
          <p className="text-gray-500">Sugeridas listas</p>
        </div>
        <div className="rounded-lg border bg-white px-3 py-3 shadow-sm">
          <p className="text-2xl font-bold text-amber-600">
            {pendingSuggested.length}
          </p>
          <p className="text-gray-500">Por agregar</p>
        </div>
      </div>

      {/* Lista: ya agregadas */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-gray-900">
            Categorías agregadas ({categories.length})
          </h2>
          <p className="text-xs text-gray-500">Estas ya forman parte de tu menú</p>
        </div>
        {loading ? (
          <p className="px-4 py-6 text-sm text-gray-500">Cargando...</p>
        ) : categories.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500">
            Aún no hay categorías. Usa las sugerencias de abajo o crea una
            personalizada.
          </p>
        ) : (
          <ul className="divide-y">
            {categories.map((cat) => {
              const isSuggested = SUGGESTED.some(
                (s) =>
                  s.short.toLowerCase() === cat.shortName.toLowerCase() ||
                  s.name.toLowerCase() === cat.name.toLowerCase()
              );
              return (
                <li
                  key={cat.id}
                  className="flex items-start gap-3 px-4 py-3"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
                    <Check className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{cat.name}</p>
                    <p className="text-xs text-gray-500">
                      Corto: {cat.shortName}
                      {isSuggested ? " · Sugerida" : " · Personalizada"}
                    </p>
                    {cat.description && (
                      <p className="mt-0.5 text-xs text-gray-400">
                        {cat.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Checklist sugeridas */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-4 py-3">
          <h2 className="font-semibold text-gray-900">Sugerencias del sistema</h2>
          <p className="text-xs text-gray-500">
            Marca cuáles ya tienes y agrega las que falten
          </p>
        </div>
        <ul className="divide-y">
          {SUGGESTED.map((s) => {
            const done = isSuggestedAdded(s.short, s.name);
            return (
              <li
                key={s.short}
                className={cn(
                  "flex items-center justify-between gap-3 px-4 py-3",
                  done && "bg-brand-green/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      done
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-gray-100 text-gray-400"
                    )}
                  >
                    {done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Circle className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p
                      className={cn(
                        "font-medium",
                        done ? "text-gray-600 line-through" : "text-gray-900"
                      )}
                    >
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500">{s.description}</p>
                  </div>
                </div>
                {done ? (
                  <span className="shrink-0 text-xs font-medium text-brand-green">
                    Agregada
                  </span>
                ) : (
                  <Button
                    type="button"
                    variant="blue"
                    size="sm"
                    disabled={adding === s.short}
                    onClick={() => addSuggested(s.name, s.short)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {adding === s.short ? "..." : "Agregar"}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Personalizadas pendientes de crear - only show hint if none custom yet */}
      {customCategories.length > 0 && (
        <p className="text-xs text-gray-500">
          Incluyes {customCategories.length} categoría
          {customCategories.length !== 1 ? "s" : ""} personalizada
          {customCategories.length !== 1 ? "s" : ""} además de las sugeridas.
        </p>
      )}

      <Button variant="outline" fullWidth onClick={() => setModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Agregar categoría personalizada
      </Button>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        companyId={companyId}
        onSaved={() => {
          setModalOpen(false);
          loadCategories();
        }}
      />

      <Button variant="green" fullWidth onClick={finish}>
        Ir al dashboard ({categories.length} categoría
        {categories.length !== 1 ? "s" : ""})
      </Button>
    </main>
  );
}
