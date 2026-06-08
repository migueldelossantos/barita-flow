"use client";

import { uploadCompanyImage } from "@/infrastructure/storage/upload";
import Image from "next/image";
import { useState } from "react";
import { Button } from "../ui/Button";

interface ImageUploadFieldProps {
  companyId: string;
  folder: "logo" | "banner" | "products";
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ImageUploadField({
  companyId,
  folder,
  label,
  value,
  onChange,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadCompanyImage(companyId, file, folder);
    setUploading(false);
    if (url) onChange(url);
    else alert("Error al subir imagen");
  };

  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {value && (
        <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-lg border">
          <Image src={value} alt="" fill className="object-cover" />
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={uploading}
        className="text-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-1"
          onClick={() => onChange(null)}
        >
          Quitar
        </Button>
      )}
      {uploading && (
        <p className="text-xs text-gray-500">Subiendo...</p>
      )}
    </div>
  );
}
