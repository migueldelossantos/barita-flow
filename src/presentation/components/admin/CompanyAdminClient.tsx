"use client";

import { saveCompanyProfile } from "@/app/actions/admin";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ImageUploadField } from "./ImageUploadField";

export function CompanyAdminClient() {
  const { company, companyId, refresh, loading } = useCompany();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [address, setAddress] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState("");
  const [bank, setBank] = useState("");
  const [clabe, setClabe] = useState("");
  useEffect(() => {
    if (!company) return;
    setName(company.name);
    setSlogan(company.profile?.slogan ?? "");
    setAddress(company.profile?.address ?? "");
    setWhatsapp(company.profile?.whatsappPhone ?? company.phone);
    setLogoUrl(company.profile?.logoUrl ?? null);
    setBannerUrl(company.profile?.bannerUrl ?? null);
    setOwnerName(company.profile?.transferOwnerName ?? "");
    setBank(company.profile?.transferBank ?? "");
    setClabe(company.profile?.transferClabe ?? "");
  }, [company]);

  if (loading || !companyId) {
    return <p className="text-gray-500">Cargando...</p>;
  }

  const licenseExpired =
    company && new Date(company.licenseExpiresAt) < new Date();

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
        bannerUrl,
        transferOwnerName: ownerName,
        transferBank: bank,
        transferClabe: clabe,
      });
      await refresh();
      alert("Guardado correctamente");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Mi empresa</h1>

      <form onSubmit={handleSave} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre</label>
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
        <ImageUploadField
          companyId={companyId}
          folder="banner"
          label="Banner del menú"
          value={bannerUrl}
          onChange={setBannerUrl}
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
        <a
          href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-brand-blue underline"
        >
          Ver / seleccionar en mapa
        </a>

        <div>
          <label className="mb-1 block text-sm font-medium">WhatsApp del negocio</label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <hr />
        <h2 className="font-semibold">Transferencia</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">Nombre del propietario</label>
          <input
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Banco</label>
          <input
            value={bank}
            onChange={(e) => setBank(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">CLABE</label>
          <input
            value={clabe}
            onChange={(e) => setClabe(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" variant="green" disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </form>

      <section className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Licencia</h2>
        <p className="mt-2 text-sm text-gray-600">
          Tipo: <strong>{company?.licenseType}</strong>
        </p>
        <p className={`text-sm ${licenseExpired ? "text-red-600" : "text-gray-600"}`}>
          Vence:{" "}
          {company
            ? new Date(company.licenseExpiresAt).toLocaleDateString("es-MX")
            : "—"}
          {licenseExpired && " (expirada)"}
        </p>
        {companyId && (
          <p className="mt-4 text-xs text-gray-400">
            Enlace del menú:{" "}
            <code className="break-all">
              {typeof window !== "undefined"
                ? `${window.location.origin}/menu/${companyId}`
                : `/menu/${companyId}`}
            </code>
          </p>
        )}
      </section>
    </div>
  );
}
