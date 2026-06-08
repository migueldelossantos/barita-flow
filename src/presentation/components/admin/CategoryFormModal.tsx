"use client";

import { saveCategory } from "@/app/actions/admin";
import type { Category } from "@/domain/entities/product";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  companyId: string;
  category?: Category | null;
  onSaved: () => void;
}

export function CategoryFormModal({
  open,
  onClose,
  companyId,
  category,
  onSaved,
}: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? "");
  const [shortName, setShortName] = useState(category?.shortName ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(category?.name ?? "");
    setShortName(category?.shortName ?? "");
    setDescription(category?.description ?? "");
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCategory(companyId, {
        id: category?.id,
        name,
        shortName: shortName || name.slice(0, 12).toLowerCase(),
        description,
      });
      onSaved();
      onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? "Editar categoría" : "Nueva categoría"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="mb-1 block text-sm font-medium">Nombre corto</label>
          <input
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            placeholder="ej. snacks"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="green" fullWidth disabled={saving}>
            {category ? "Guardar" : "Agregar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
