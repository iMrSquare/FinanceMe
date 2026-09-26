export type { Role, SessionUser, ColorMode } from './auth-edge';
export { createToken, verifyToken } from './auth-edge';

import { createToken } from './auth-edge';
import type { SessionUser } from './auth-edge';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getUserById } from './db';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const attempt = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(attempt, 'hex'));
}

export async function getSession(): Promise<SessionUser | null> {
  const { verifyToken } = await import('./auth-edge');
  const store = await cookies();
  const token = store.get('auth-token')?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;

  // La apariencia (tema/modo color/acentos) se lee siempre en fresco de la BBDD
  // en vez de confiar en el snapshot del JWT, para que un cambio hecho en un
  // dispositivo se refleje de inmediato en cualquier otro dispositivo/sesión.
  const dbUser = getUserById(session.id);
  if (!dbUser) return session;

  return {
    ...session,
    theme: dbUser.theme,
    colorMode: dbUser.color_mode,
    accentPersonal: dbUser.accent_personal,
    accentHogar: dbUser.accent_hogar,
  };
}

export const AUTH_COOKIE_NAME = 'auth-token';

export const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.HTTPS === 'true',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
};

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const store = await cookies();
  store.set(AUTH_COOKIE_NAME, token, AUTH_COOKIE_OPTIONS);
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(AUTH_COOKIE_NAME);
}

export function canEdit(role: string): boolean {
  return role === 'admin' || role === 'editor';
}

export function isAdmin(role: string): boolean {
  return role === 'admin';
}

export async function requireSession(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  return session;
}

export async function requireEditor(): Promise<SessionUser | NextResponse> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
  if (!canEdit(session.role)) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
  return session;
}
