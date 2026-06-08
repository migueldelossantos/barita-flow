export function generateProductCode(name: string, existingCodes: string[]): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");

  let n = 1;
  let code = `${base}-${String(n).padStart(3, "0")}`;
  while (existingCodes.includes(code)) {
    n += 1;
    code = `${base}-${String(n).padStart(3, "0")}`;
  }
  return code;
}
