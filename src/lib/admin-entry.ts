export const ADMIN_ENTRY_KEY = "portfolio:developer-entry";
export function grantAdminEntry() {
  sessionStorage.setItem(ADMIN_ENTRY_KEY, "1");
}
export function hasAdminEntry() {
  try { return sessionStorage.getItem(ADMIN_ENTRY_KEY) === "1"; }
  catch { return false; }
}

export function clearAdminEntry() {
  try { sessionStorage.removeItem(ADMIN_ENTRY_KEY); } catch { /* storage unavailable */ }
}
