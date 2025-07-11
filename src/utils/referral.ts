/**
 * Extrae el ID de referido de la URL si existe
 */
export const extractReferralId = (): string | null => {
  if (typeof window === "undefined") return null;

  const urlParams = new URLSearchParams(window.location.search);
  const referralId = urlParams.get("ref");

  return referralId;
};

/**
 * Guarda el ID de referido en localStorage
 */
export const saveReferralId = (referralId: string): void => {
  if (!referralId) return;
  localStorage.setItem("referredBy", referralId);
};

/**
 * Obtiene el ID de referido guardado
 */
export const getReferralId = (): string | null => {
  return localStorage.getItem("referredBy");
};

/**
 * Verifica si el usuario actual fue referido
 */
export const wasReferred = (): boolean => {
  return !!getReferralId();
};

/**
 * Limpia el ID de referido después de una compra
 */
export const clearReferralId = (): void => {
  localStorage.removeItem("referredBy");
};
