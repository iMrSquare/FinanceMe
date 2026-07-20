import { SignJWT, jwtVerify } from 'jose';

export const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'financeme-hogar-secret-change-in-production'
);

export type Role = 'admin' | 'editor' | 'visor';

export type ColorMode = 'light' | 'dark' | 'system';

export interface SessionUser {
  id: number;
  username: string;
  nombre: string;
  role: Role;
  avatarUrl: string | null;
  mustChangePassword?: boolean;
  tutorialSeen?: boolean;
  theme: string;
  colorMode: ColorMode;
  accentPersonal: string | null;
  accentHogar: string | null;
}

export async function createToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: String(user.id),
    username: user.username,
    nombre: user.nombre,
    role: user.role,
    avatarUrl: user.avatarUrl,
    mustChangePassword: user.mustChangePassword ?? false,
    tutorialSeen: user.tutorialSeen ?? false,
    theme: user.theme,
    colorMode: user.colorMode,
    accentPersonal: user.accentPersonal,
    accentHogar: user.accentHogar,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.sub),
      username: payload.username as string,
      nombre: payload.nombre as string,
      role: payload.role as Role,
      avatarUrl: (payload.avatarUrl as string | null) ?? null,
      mustChangePassword: (payload.mustChangePassword as boolean) ?? false,
      tutorialSeen: (payload.tutorialSeen as boolean) ?? false,
      theme: (payload.theme as string) ?? 'indigo',
      colorMode: (payload.colorMode as ColorMode) ?? 'system',
      accentPersonal: (payload.accentPersonal as string | null) ?? null,
      accentHogar: (payload.accentHogar as string | null) ?? null,
    };
  } catch {
    return null;
  }
}
