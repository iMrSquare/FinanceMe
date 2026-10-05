'use client';

import { useEffect } from 'react';
import { reconcilePush } from '@/lib/pushClient';

// Registra el service worker en cada arranque con sesión y reconcilia la suscripción con
// el servidor (ver reconcilePush). Nunca pide permisos: eso solo se hace desde Avisos.
export default function PushRegistrar() {
  useEffect(() => { reconcilePush(); }, []);
  return null;
}
