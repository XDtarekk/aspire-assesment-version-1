import type { Role } from "./api";

export function parseJwtPayload(token: string): { sub?: string; role?: Role } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return {};
    const payload = JSON.parse(atob(parts[1]));
    return { sub: payload.sub, role: payload.role };
  } catch {
    return {};
  }
}
