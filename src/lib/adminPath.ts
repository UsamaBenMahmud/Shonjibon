const configuredPath = import.meta.env.VITE_ADMIN_PATH?.trim() || "/control-room";

export const ADMIN_PATH = `/${configuredPath.replace(/^\/+|\/+$/g, "")}`;
export const ADMIN_LAST_ACTIVITY_KEY = "shonjibon.admin.lastActivity";

export function adminHref(path = ""): string {
  return `${ADMIN_PATH}${path ? `/${path.replace(/^\/+/, "")}` : ""}`;
}
