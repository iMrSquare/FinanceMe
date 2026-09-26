import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';
import { getSession } from '@/lib/auth';

const plex = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], display: 'swap' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#172033',
};

export const metadata: Metadata = {
  title: 'FinanceMe',
  description: 'Finanzas personales y del hogar',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black',
    title: 'FinanceMe',
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=1.2.0', sizes: '180x180' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  // Temas retirados (Clásico, Monokai, Dracula) caen en Institucional
  const theme = ['institucional', 'ambar', 'rosa', 'contraste'].includes(session?.theme ?? '') ? session!.theme : 'institucional';
  const colorMode = session?.colorMode ?? 'system';
  const isDark = colorMode === 'dark';

  const accentStyle: Record<string, string> = {};
  if (session?.accentPersonal) accentStyle['--accent-personal'] = session.accentPersonal;
  if (session?.accentHogar) accentStyle['--accent-hogar'] = session.accentHogar;

  return (
    <html
      lang="es"
      data-theme={theme}
      className={isDark ? 'dark' : undefined}
      style={accentStyle as React.CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const html = document.documentElement;
            const isLogin = location.pathname.startsWith('/login');
            if (isLogin) {
              html.removeAttribute('data-theme');
              html.classList.remove('dark');
              html.style.removeProperty('--accent-personal');
              html.style.removeProperty('--accent-hogar');
            } else {
              if (${JSON.stringify(colorMode)} === 'system' && matchMedia('(prefers-color-scheme:dark)').matches) {
                html.classList.add('dark');
              }
              if (!html.getAttribute('data-theme')) {
                try {
                  const cached = JSON.parse(localStorage.getItem('appearance') || 'null');
                  if (cached) {
                    if (cached.theme) html.setAttribute('data-theme', cached.theme);
                    if (cached.accentPersonal) html.style.setProperty('--accent-personal', cached.accentPersonal);
                    if (cached.accentHogar) html.style.setProperty('--accent-hogar', cached.accentHogar);
                  }
                } catch {}
              }
            }
          } catch {}
          try { if (typeof window.ethereum === 'undefined') window.ethereum = {}; } catch {}
        ` }} />
      </head>
      <body className={plex.className}>
        {children}
      </body>
    </html>
  );
}
