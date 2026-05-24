import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
    icon: '/logo_FinanceMe-Hogar.png',
    apple: [{ url: '/logo_FinanceMe-Hogar.png', sizes: '512x512' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          try {
            const t = localStorage.getItem('theme');
            if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme:dark)').matches))
              document.documentElement.classList.add('dark');
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
