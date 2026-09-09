"use client";

import {
  createCompany,
  linkMemberToCompany,
  resolveLicenseRequest,
  updateCompanyLicense,
} from "@/app/actions/super-admin";
import type { LicenseType } from "@/domain/enums";
import { createClient } from "@/infrastructure/supabase/client";
import { Copy, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface CompanyRow {
  id: string;
  name: string;
  phone: string;
  licenseType: LicenseType;
  licenseExpiresAt: string;
  isSetupComplete: boolean;
}

interface LicenseRequestRow {
  id: string;
  requestedLicense: LicenseType;
  kind: "change" | "reactivation";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  company: { id: string; name: string; phone: string; contactEmail: string | null } | null;
}

export function SuperAdminClient() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseType, setLicenseType] = useState<LicenseType>("FREE");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [linkEmail, setLinkEmail] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<LicenseRequestRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [{ data }, { data: requestRows }] = await Promise.all([
      supabase.from("companies").select("*").order("created_at", { ascending: false }),
      supabase.from("license_requests").select("id, requested_license, kind, status, created_at, companies(id, name, phone, contact_email)").order("created_at", { ascending: false }),
    ]);

    setCompanies(
      (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        phone: c.phone,
        licenseType: c.license_type,
        licenseExpiresAt: c.license_expires_at,
        isSetupComplete: c.is_setup_complete,
      }))
    );
    setRequests((requestRows ?? []).map((request) => {
      const rawCompany = request.companies as unknown as { id: string; name: string; phone: string; contact_email: string | null } | { id: string; name: string; phone: string; contact_email: string | null }[] | null;
      const company = Array.isArray(rawCompany) ? rawCompany[0] : rawCompany;
      return { id: request.id, requestedLicense: request.requested_license as LicenseType, kind: request.kind as "change" | "reactivation", status: request.status as LicenseRequestRow["status"], createdAt: request.created_at, company: company ? { id: company.id, name: company.name, phone: company.phone, contactEmail: company.contact_email } : null };
    }));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { id } = await createCompany({
        name,
        phone,
        licenseType,
        ownerEmail: ownerEmail || undefined,
      });
      setModalOpen(false);
      setName("");
      setPhone("");
      setOwnerEmail("");
      load();
      alert(`Empresa creada. Menú: /menu/${id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const copyMenuLink = (id: string) => {
    const url = `${window.location.origin}/menu/${id}`;
    navigator.clipboard.writeText(url);
    alert("Enlace copiado");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Super Admin</h1>
          <p className="text-sm text-gray-500">
            Alta de negocios y licencias
          </p>
        </div>
        <Button variant="green" onClick={() => setModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo negocio
        </Button>
      </div>

      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4"><h2 className="text-lg font-bold">Solicitudes de licencia</h2><p className="text-sm text-gray-500">Aprueba para aplicar la licencia solicitada y renovar su vigencia por un mes.</p></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="border-b bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-3 py-2">Empresa</th><th className="px-3 py-2">Contacto</th><th className="px-3 py-2">Solicitud</th><th className="px-3 py-2">Fecha</th><th className="px-3 py-2">Estado</th><th className="px-3 py-2 text-right">Acciones</th></tr></thead><tbody>{requests.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-gray-500">No hay solicitudes.</td></tr> : requests.map((request) => <tr key={request.id} className="border-b"><td className="px-3 py-3 font-medium">{request.company?.name ?? "Empresa eliminada"}<p className="font-mono text-xs font-normal text-gray-400">{request.company?.id}</p></td><td className="px-3 py-3 text-xs">{request.company?.phone}<br />{request.company?.contactEmail}</td><td className="px-3 py-3">{request.kind === "reactivation" ? "Reactivación" : "Cambio"}: <strong>{request.requestedLicense}</strong></td><td className="px-3 py-3">{new Date(request.createdAt).toLocaleDateString("es-MX")}</td><td className="px-3 py-3">{request.status === "pending" ? "Pendiente" : request.status === "approved" ? "Aprobada" : "Rechazada"}</td><td className="px-3 py-3 text-right">{request.status === "pending" && <div className="flex justify-end gap-2"><Button size="sm" variant="green" onClick={async () => { const note = window.prompt("Nota para el cliente (opcional):") ?? ""; try { await resolveLicenseRequest(request.id, "approved", note); load(); } catch (error) { alert(error instanceof Error ? error.message : "No se pudo aprobar"); } }}>Aprobar</Button><Button size="sm" variant="outline" className="text-red-600" onClick={async () => { const note = window.prompt("Motivo o nota para el cliente:"); if (note === null) return; try { await resolveLicenseRequest(request.id, "rejected", note); load(); } catch (error) { alert(error instanceof Error ? error.message : "No se pudo rechazar"); } }}>Rechazar</Button></div>}</td></tr>)}</tbody></table></div>
      </section>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Licencia</th>
              <th className="px-4 py-3">Vence</th>
              <th className="px-4 py-3">Menú</th>
              <th className="px-4 py-3">Vincular dueño</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  Cargando...
                </td>
              </tr>
            ) : (
              companies.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.phone}</td>
                  <td className="px-4 py-3">
                    <select
                      value={c.licenseType}
                      className="rounded border px-2 py-1 text-xs"
                      onChange={async (e) => {
                        await updateCompanyLicense(
                          c.id,
                          e.target.value as LicenseType
                        );
                        load();
                      }}
                    >
                      <option value="FREE">FREE</option>
                      <option value="BASICA">Básica</option>
                      <option value="PREMIUM">Premium</option>
                      <option value="DEMO">DEMO (legado)</option>
                      <option value="RENTA">RENTA (legado)</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {new Date(c.licenseExpiresAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="flex items-center gap-1 text-brand-blue"
                      onClick={() => copyMenuLink(c.id)}
                    >
                      <Copy className="h-3 w-3" />
                      QR / Link
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <input
                        type="email"
                        placeholder="email@dueño.com"
                        className="w-36 rounded border px-2 py-1 text-xs"
                        value={linkEmail[c.id] ?? ""}
                        onChange={(e) =>
                          setLinkEmail((s) => ({
                            ...s,
                            [c.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        size="sm"
                        variant="blue"
                        onClick={async () => {
                          const email = linkEmail[c.id];
                          if (!email) return;
                          try {
                            await linkMemberToCompany(c.id, email);
                            alert("Usuario vinculado");
                          } catch (e) {
                            alert(
                              e instanceof Error ? e.message : "Error"
                            );
                          }
                        }}
                      >
                        OK
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nuevo negocio">
        <form onSubmit={handleCreate} className="space-y-4">
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
            <label className="mb-1 block text-sm font-medium">Teléfono</label>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              placeholder="5215512345678"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tipo de licencia</label>
            <select
              value={licenseType}
              onChange={(e) => setLicenseType(e.target.value as LicenseType)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              <option value="FREE">FREE (1 mes)</option>
              <option value="BASICA">Básica (1 mes)</option>
              <option value="PREMIUM">Premium (1 mes)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">
              Email del dueño (opcional)
            </label>
            <input
              type="email"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" fullWidth onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="green" fullWidth disabled={saving}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
