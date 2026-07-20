import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getSession } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#6366f1',
};

export const metadata: Metadata = {
  title: 'FinanceMe Hogar',
  description: 'Gestión de gastos del hogar',
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
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const theme = session?.theme ?? 'indigo';
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
