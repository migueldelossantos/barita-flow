"use client";

import { saveCompanyProfile } from "@/app/actions/admin";
import { useCompany } from "@/presentation/providers/CompanyProvider";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Copy, Download, QrCode } from "lucide-react";
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
  const [menuUrl, setMenuUrl] = useState("");
  const [menuQr, setMenuQr] = useState("");

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

  useEffect(() => {
    if (!companyId || typeof window === "undefined") return;
    setMenuUrl(`${window.location.origin}/menu/${companyId}`);
  }, [companyId]);

  useEffect(() => {
    if (!menuUrl) return;

    let active = true;

    QRCode.toDataURL(menuUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (active) setMenuQr(dataUrl);
      })
      .catch((error) => {
        console.error("Error generating menu QR:", error);
      });

    return () => {
      active = false;
    };
  }, [menuUrl]);

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

  const copyQrImage = async () => {
    if (!menuQr) return;

    try {
      const response = await fetch(menuQr);
      const blob = await response.blob();
      if ("ClipboardItem" in window && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        await navigator.clipboard.writeText(menuUrl);
      }
      alert("QR copiado");
    } catch (error) {
      console.error("copyQrImage error:", error);
      alert("No se pudo copiar el QR como imagen");
    }
  };

  const downloadQr = () => {
    if (!menuQr) return;
    const link = document.createElement("a");
    link.href = menuQr;
    link.download = `qr-menu-${companyId}.png`;
    link.click();
  };

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold">Mi empresa</h1>

      <form
        onSubmit={handleSave}
        className="space-y-4 rounded-xl border bg-white p-6 shadow-sm"
      >
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
          label="Banner del menu"
          value={bannerUrl}
          onChange={setBannerUrl}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">Direccion</label>
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
          <label className="mb-1 block text-sm font-medium">
            WhatsApp del negocio
          </label>
          <input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>

        <hr />
        <h2 className="font-semibold">Transferencia</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nombre del propietario
          </label>
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
        <p
          className={`text-sm ${
            licenseExpired ? "text-red-600" : "text-gray-600"
          }`}
        >
          Vence:{" "}
          {company
            ? new Date(company.licenseExpiresAt).toLocaleDateString("es-MX")
            : "—"}
          {licenseExpired && " (expirada)"}
        </p>

        {companyId && (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-gray-400">
              Enlace del menu:{" "}
              <code className="break-all">
                {menuUrl || `/menu/${companyId}`}
              </code>
            </p>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <QrCode className="h-4 w-4 text-brand-green" />
                <h3 className="text-sm font-semibold">QR del menu</h3>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="rounded-2xl border bg-white p-3 shadow-sm">
                  {menuQr ? (
                    <img
                      src={menuQr}
                      alt="QR del menu"
                      className="h-48 w-48 rounded-lg"
                    />
                  ) : (
                    <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                      Generando QR...
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Button type="button" variant="blue" onClick={copyQrImage}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar como imagen
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={downloadQr}
                    disabled={!menuQr}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar QR
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
