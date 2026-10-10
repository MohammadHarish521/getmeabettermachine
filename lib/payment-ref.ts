/** Our payment id from a return URL. Dodo may append its own pay_… ids to the same keys. */
export function localPaymentId(value: string | string[] | undefined) {
  const parts = (Array.isArray(value) ? value : value ? [value] : [])
    .flatMap((part) => part.split(","))
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.find((part) => !part.startsWith("pay_")) ?? null;
}
