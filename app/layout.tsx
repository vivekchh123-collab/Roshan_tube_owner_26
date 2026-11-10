import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roshan Tubes — Owner',
  robots: { index: false, follow: false },
  icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.json',
};
export const viewport: Viewport = { themeColor: '#0b57c8', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          <Providers>
            <Navbar />
            <main className="mx-auto min-h-screen max-w-5xl px-3 pb-16 pt-20">{children}</main>
          </Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}
