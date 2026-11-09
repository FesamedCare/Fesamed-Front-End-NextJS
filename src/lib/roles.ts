/**
 * Rol de la cuenta y formato del teléfono para mostrarlos en la interfaz.
 */
export type Role = "doctor" | "patient" | "admin";

/** La API manda el rol como objeto ({ name }) o, en algunos tipos, como texto. */
export function roleOf(role: unknown): Role | null {
  const name = typeof role === "string" ? role : (role as { name?: unknown } | null | undefined)?.name;
  return name === "doctor" || name === "patient" || name === "admin" ? name : null;
}

/**
 * El teléfono llega en formato RFC 3966 ("tel:+57-304-3959321"), que es como
 * lo guarda la validación de la API. Para leerlo: "+57 304 3959321".
 */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.replace(/^tel:/i, "").replace(/-/g, " ").trim();
}
