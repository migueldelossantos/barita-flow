interface MenuClosedNoticeProps {
  companyName: string;
  openingTime?: string | null;
  closingTime?: string | null;
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":");
  if (!hours || !minutes) return value;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function MenuClosedNotice({
  companyName,
  openingTime,
  closingTime,
}: MenuClosedNoticeProps) {
  const openLabel = formatTime(openingTime);
  const closeLabel = formatTime(closingTime);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md rounded-2xl border bg-white p-6 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-green">
          Menú temporalmente no disponible
        </p>
        <h1 className="mt-3 text-2xl font-bold text-gray-900">
          {companyName}
        </h1>
        <p className="mt-3 text-sm text-gray-600">
          En este momento el menú está apagado.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          {openLabel && closeLabel
            ? `Horario de atención: ${openLabel} a ${closeLabel}.`
            : "El horario de atención aún no está configurado."}
        </p>
      </div>
    </div>
  );
}
