"use client";

import { saveCompanyProfile } from "@/app/actions/admin";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ImageUploadField } from "./ImageUploadField";

export function SetupWizardClient() {
  const { company, companyId, refresh } = useCompany();
  const router = useRouter();
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [bank, setBank] = useState("");
  const [clabe, setClabe] = useState("");
  const [menuEnabled, setMenuEnabled] = useState(true);
  const [menuOpenTime, setMenuOpenTime] = useState("");
  const [menuCloseTime, setMenuCloseTime] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setWhatsapp(company.profile?.whatsappPhone ?? company.phone);
    setMenuEnabled(company.profile?.menuEnabled ?? true);
    setMenuOpenTime(company.profile?.menuOpenTime ?? "");
    setMenuCloseTime(company.profile?.menuCloseTime ?? "");
  }, [company]);

  if (!companyId) {
    return (
      <p className="p-6 text-gray-500">
        Tu cuenta no está vinculada a un negocio. Contacta al administrador del
        sistema.
      </p>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCompanyProfile(companyId, {
        name,
        slogan,
        address,
        whatsappPhone: whatsapp,
        logoUrl,
        bannerUrl: null,
        transferOwnerName: ownerName,
        transferBank: bank,
        transferClabe: clabe,
        menuEnabled,
        menuOpenTime,
        menuCloseTime,
        isSetupComplete: false,
      });
      await refresh();
      router.push("/admin/setup/categories");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-8 p-6">
      <h1 className="text-2xl font-bold">Configuración inicial</h1>
      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nombre del negocio
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Slogan</label>
          <input
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <ImageUploadField
          companyId={companyId}
          folder="logo"
          label="Logotipo"
          value={logoUrl}
          onChange={setLogoUrl}
        />
        <div>
          <label className="mb-1 block text-sm font-medium">Dirección</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Teléfono / WhatsApp
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="rounded-xl border bg-gray-50 p-4">
          <label className="flex items-center gap-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={menuEnabled}
              onChange={(e) => setMenuEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Encender o apagar menú
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Hora de apertura
              </label>
              <input
                type="time"
                value={menuOpenTime}
                onChange={(e) => setMenuOpenTime(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Hora de cierre
              </label>
              <input
                type="time"
                value={menuCloseTime}
                onChange={(e) => setMenuCloseTime(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
        <hr />
        <h2 className="font-semibold">Datos para transferencia</h2>
        <input
          placeholder="Nombre del propietario"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          placeholder="Banco"
          value={bank}
          onChange={(e) => setBank(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          placeholder="CLABE"
          value={clabe}
          onChange={(e) => setClabe(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <Button type="submit" variant="green" fullWidth disabled={saving}>
          Guardar y continuar
        </Button>
      </form>
    </main>
  );
}
